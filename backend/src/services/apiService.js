const db = require('../models/index');
const bycrypt = require('bcryptjs');
const { Op, where } = require('sequelize');
const { generateToken, verifyToken } = require('../controllers/JWTActions');
const { checkWL, clearWL, createWL } = require('../controllers/checkWhiteList');
const _ = require('lodash');
const csv = require('fast-csv');
const fs = require('fs');
const nodemailer = require('nodemailer');
const htmlMinifier = require('html-minifier');


const DateToString = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
};
const ReplaceVariable = (htmlContent, dynamicData) => {
    for (let key in dynamicData) {
        const regex = new RegExp('{{' + key + '}}', 'g');
        htmlContent = htmlContent.replace(regex, dynamicData[key]);
    }
    return htmlContent;
}

const REPRESENTATIVE_ROLE = {
    LEADER: 'LEADER',
    COACH: 'COACH'
};

const normalizeString = (value) => {
    if (typeof value !== 'string') return '';
    return value.trim();
};

const pickFirstNonEmpty = (...values) => {
    for (const value of values) {
        const normalized = normalizeString(value);
        if (normalized) return normalized;
    }
    return null;
};

const parseRepresentativeRole = (rawRole) => {
    const role = normalizeString(rawRole).toUpperCase();
    if (role === REPRESENTATIVE_ROLE.LEADER || role === REPRESENTATIVE_ROLE.COACH) {
        return role;
    }
    return null;
};

const buildCoachRepresentativePayload = (data) => ({
    role: REPRESENTATIVE_ROLE.COACH,
    fullName: pickFirstNonEmpty(data?.coachName, data?.coach?.fullName, data?.trainerName),
    phone: pickFirstNonEmpty(data?.coachPhone, data?.coach?.phone, data?.trainerPhone),
    email: pickFirstNonEmpty(data?.coachEmail, data?.coach?.email),
    citizenId: pickFirstNonEmpty(data?.coachCitizenId, data?.coach?.citizenId)
});

const buildLeaderRepresentativePayload = (data) => {
    const firstParticipant = data?.Participants?.[0] || {};

    return {
        role: REPRESENTATIVE_ROLE.LEADER,
        fullName: pickFirstNonEmpty(data?.leaderName, data?.leader?.fullName, firstParticipant?.fullName),
        phone: pickFirstNonEmpty(data?.leaderPhone, data?.leader?.phone, firstParticipant?.phone),
        email: pickFirstNonEmpty(data?.leaderEmail, data?.leader?.email),
        citizenId: pickFirstNonEmpty(data?.leaderCitizenId, data?.leader?.citizenId, firstParticipant?.citizenId)
    };
};

const upsertTeamRepresentative = async (teamId, payload, transaction) => {
    const hasData = !!(payload.fullName || payload.phone || payload.email || payload.citizenId);

    if (!hasData) {
        await db.Representative.destroy({
            where: {
                teamId,
                role: payload.role
            },
            transaction
        });
        return;
    }

    const representative = await db.Representative.findOne({
        where: {
            teamId,
            role: payload.role
        },
        transaction
    });

    if (representative) {
        await db.Representative.update({
            fullName: payload.fullName,
            phone: payload.phone,
            email: payload.email,
            citizenId: payload.citizenId
        }, {
            where: {
                teamId,
                role: payload.role
            },
            transaction
        });
        return;
    }

    await db.Representative.create({
        teamId,
        role: payload.role,
        fullName: payload.fullName,
        phone: payload.phone,
        email: payload.email,
        citizenId: payload.citizenId
    }, { transaction });
};

const upsertTeamRepresentatives = async (teamId, data, transaction) => {
    const explicitRole = parseRepresentativeRole(data?.representativeRole);
    const hasLeaderInput = !!(
        normalizeString(data?.leaderName) ||
        normalizeString(data?.leaderPhone) ||
        normalizeString(data?.leaderEmail) ||
        normalizeString(data?.leaderCitizenId)
    );

    const selectedRole = explicitRole || (hasLeaderInput ? REPRESENTATIVE_ROLE.LEADER : REPRESENTATIVE_ROLE.COACH);

    const selectedPayload = selectedRole === REPRESENTATIVE_ROLE.LEADER
        ? buildLeaderRepresentativePayload(data)
        : buildCoachRepresentativePayload(data);

    const oppositeRole = selectedRole === REPRESENTATIVE_ROLE.LEADER
        ? REPRESENTATIVE_ROLE.COACH
        : REPRESENTATIVE_ROLE.LEADER;

    await upsertTeamRepresentative(teamId, selectedPayload, transaction);
    await db.Representative.destroy({
        where: {
            teamId,
            role: oppositeRole
        },
        transaction
    });
};

const getTeamRepresentativesMap = async (teamId) => {
    const rows = await db.Representative.findAll({
        where: { teamId },
        attributes: ['role', 'fullName', 'phone', 'email', 'citizenId'],
        raw: true
    });

    return rows.reduce((acc, row) => {
        acc[row.role] = {
            fullName: row.fullName,
            phone: row.phone,
            email: row.email,
            citizenId: row.citizenId
        };
        return acc;
    }, {});
};

const getCoachName = (processData, representativesMap) => {
    return representativesMap?.[REPRESENTATIVE_ROLE.COACH]?.fullName || processData?.trainerName || null;
};

const generatePIN = (PinLength) => {
    // Khai báo một biến để lưu trữ mã PIN
    let pin = '';

    // Tạo một vòng lặp để tạo ra 6 chữ số ngẫu nhiên
    for (let i = 0; i < PinLength; i++) {
        // Sử dụng hàm ngẫu nhiên Math.random() để chọn một chữ số từ 0 đến 9
        // Lấy phần nguyên của kết quả nhân với 10 để đảm bảo rằng nó là một số nguyên từ 0 đến 9
        const digit = Math.floor(Math.random() * 10);

        // Thêm chữ số này vào mã PIN
        pin += digit;
    }

    // Trả về mã PIN đã tạo
    return pin;
}
const apiSendingEmailService = async (email, title, content) => {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASSWORD
        }
    });
    let mailOptions = {
        from: `"${process.env.EMAIL_NAME}" <${process.env.EMAIL}>`,
        to: email,
        subject: title,
        html: content
    };
    try {
        await transporter.sendMail(mailOptions);
        return {
            EM: 'Send email success',
            EC: 0,
            DT: ''
        }
    } catch (error) {
        return {
            EM: 'Send email failed',
            EC: 500,
            DT: ''
        }
    }
}
const apiLoginService = async (email, password) => {
    try {
        let user = {};
        let user1 = await db.User.findOne({
            where: {
                email: email
            },
            raw: true
        });
        if (user1) {
            user = user1;
        } else {
            let user2 = await db.User.findOne({
                where: {
                    username: email
                },
                raw: true
            });
            if (user2) {
                user = user2;
            }
            else {
                return {
                    EM: 'User not found',
                    EC: 404,
                    DT: ''
                }
            }
        }
        let check = bycrypt.compareSync(password, user.password);
        if (check) {
            let payload = {
                id: user.id,
                email: user.email,
                role: user.role
            }
            let access_token = generateToken(payload);
            let accountInfo = await db.User.findOne({
                where: {
                    email: user.email
                },
                attributes: {
                    exclude: ['password', 'updatedAt', 'createdAt']
                },
                raw: true
            });

            let teamData = await db.Team.findOne({
                where: {
                    userId: accountInfo.id
                },
                attributes: ['id', 'teamName'],
                raw: true
            });

            if (!teamData || !teamData.teamName) {
                let noTeamData = {
                    "id": accountInfo.id,
                    "email": accountInfo.email,
                    "username": accountInfo.username,
                    "role": accountInfo.role,
                    "access_token": access_token,
                    "teamName": 'Not updated yet / admin account',
                    "Participants": []
                }
                await clearWL(accountInfo.email);
                return {
                    EM: 'Login Success',
                    EC: 0,
                    DT: noTeamData
                }

            } else {
                let detailData = await db.Process.findOne({
                    where: {
                        teamId: teamData.id
                    },
                    attributes: ['paidImage', 'isPaid', 'isUpdate', 'isHighSchool', 'trainerName'],
                    raw: true
                });
                let participantData = await db.Participant.findAll({
                    where: {
                        teamId: teamData.id
                    },
                    attributes: ['id', 'fullName', 'citizenId', 'phone', 'birth', 'schoolName'],
                    raw: true
                });
                let participantData2 = participantData.map(participant => {
                    return {
                        ...participant,
                        birth: DateToString(participant.birth)
                    }
                });
                const representatives = await getTeamRepresentativesMap(teamData.id);
                const coachName = getCoachName(detailData, representatives);

                let data = {
                    id: accountInfo.id,
                    email: accountInfo.email,
                    username: accountInfo.username,
                    role: accountInfo.role,
                    access_token: access_token,
                    paidImage: detailData.paidImage,
                    isPaid: detailData.isPaid,
                    isUpdate: detailData.isUpdate,
                    isHighSchool: detailData.isHighSchool,
                    trainerName: coachName,
                    trainerPhone: representatives?.[REPRESENTATIVE_ROLE.COACH]?.phone || null,
                    representatives,
                    teamName: teamData.teamName,
                    Participants: [...participantData2]
                };
                let checkWhiteList = await db.Whitelist.findOne({
                    where: {
                        email: accountInfo.email
                    }
                });
                if (checkWhiteList) {
                    await db.Whitelist.destroy({
                        where: {
                            email: accountInfo.email
                        }
                    });
                }
                return {
                    EM: 'Login Success',
                    EC: 0,
                    DT: data
                }
            }

        }

        else {
            return {
                EM: 'Password is incorrect',
                EC: 400,
                DT: ''
            }
        }
    }
    catch (error) {
        return {
            EM: 'Internal Server Error',
            EC: 500,
            DT: ''
        }
    }
}
const apiRegisterService = async (email, password, username) => {
    try {
        let checkUser = await db.User.findOne({
            where: {
                email: email
            }
        });
        if (checkUser) {
            return {
                EM: 'Email already registered',
                EC: -1,
                DT: ''
            }
        } else {
            let checkUser2 = await db.User.findOne({
                where: {
                    username: username
                }
            });
            if (checkUser2) {
                return {
                    EM: 'Username already registered',
                    EC: -1,
                    DT: ''
                }
            }
        }
        let salt = bycrypt.genSaltSync(10);
        let hash = bycrypt.hashSync(password, salt);
        const transaction = await db.sequelize.transaction();
        let user;
        let team;

        try {
            user = await db.User.create({
                email: email,
                password: hash,
                username: username,
                role: 'USER'
            }, { transaction });

            team = await db.Team.create({
                userId: user.id,
                teamName: null
            }, { transaction });

            await db.Process.create({
                teamId: team.id,
                isUpdate: false,
                paidImage: null,
                isPaid: false,
                isHighSchool: null,
                trainerName: null
            }, { transaction });

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }

        if (!user) {
            return {
                EM: 'Register Failed',
                EC: 404,
                DT: ''
            }
        }

        let title = 'Register Success';
        let htmlContent = '';
        try {
            let id_template = await db.Settemplate.findOne({
                where: {
                    type: 'REGISTER'
                },
                attributes: ['id_template'],
                raw: true
            });
            let template = await db.Template.findOne({
                where: {
                    id: id_template.id_template
                },
                attributes: ['data'],
                raw: true
            });
            htmlContent = template.data;
        } catch (error) {
            return {
                EM: "Something went wrong with email",
                EC: 500,
                DT: ''
            }
        }

        let result = await apiSendingEmailService(email, title, htmlContent)
        console.log('result: ', result);

        //prepare data to return
        let payload = {
            id: user.id,
            email: user.email,
            role: user.role
        }
        let access_token = generateToken(payload);
        let noTeamData = {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "role": user.role,
            "access_token": access_token,
            "teamName": 'Not updated yet / admin account',
            "Participants": []
        }
        return {
            EM: 'Register Success',
            EC: 0,
            DT: noTeamData
        }

    } catch (error) {
        return {
            EM: 'Internal Server Error',
            EC: 500,
            DT: error
        }
    }
}
const apiUpdateInfoService = async (data) => {
    /**
     * data = {
     *    userId: '',
     *    teamName: '',
     *    paidImage: '',
     *    isHighSchool: '',
     *    trainerName: '',
     *    Participants: [
     *       {
     *          fullName: '',
     *          citizenId: '',
     *          phone: '',
     *          birth: '', //dd/mm/yyyy
     *          schoolName: ''
     *       }
     *    ]
     * }
     */
    const toDate = (date) => {
        const [day, month, year] = date.split("/").map(Number);
        return new Date(year, month - 1, day);
    }

    if (!data || !data.userId) {
        return {
            EM: 'Unauthorized',
            EC: 401,
            DT: ''
        }
    }

    let isUpdate = await db.User.findOne({
        where: {
            id: data.userId
        },
        attributes: [],
        raw: true,
        include: [
            {
                model: db.Team,
                attributes: [],
                include: [
                    {
                        model: db.Process,
                        attributes: ['isUpdate'],
                        raw: true
                    }
                ]
            }
        ]
    });
    if (!isUpdate) {
        return {
            EM: 'User not found',
            EC: 404,
            DT: ''
        }
    }
    if (isUpdate['Team.Process.isUpdate'] !== null && isUpdate['Team.Process.isUpdate'] !== false) {
        return {
            EM: 'User can update info only once',
            EC: 404,
            DT: ''
        }
    }
    if (!data.teamName || data.teamName === '' || !data.Participants || data?.Participants?.length < 3) {
        return {
            EM: 'Missing data to update',
            EC: 400,
            DT: ''
        }
    }

    let team;
    const transaction = await db.sequelize.transaction();

    try {
        team = await db.Team.findOne({
            where: {
                userId: data.userId
            },
            raw: true,
            transaction
        });

        if (!team) {
            team = await db.Team.create({
                userId: data.userId,
                teamName: data.teamName
            }, { transaction });
            await db.Process.create({
                teamId: team.id,
                paidImage: data.paidImage ? data.paidImage : null,
                isPaid: false,
                isHighSchool: data.isHighSchool === 'true' ? true : false,
                trainerName: buildCoachRepresentativePayload(data).fullName,
                rejectionReason: null
            }, { transaction });

        }
        else {
            await db.Team.update({
                teamName: data.teamName
            }, {
                where: {
                    userId: data.userId
                },
                transaction
            });
            await db.Process.update({
                paidImage: data.paidImage ? data.paidImage : null,
                isHighSchool: data.isHighSchool === 'true' ? true : false,
                trainerName: buildCoachRepresentativePayload(data).fullName,
                rejectionReason: null
            }, {
                where: {
                    teamId: team.id
                },
                transaction
            });
        }

        for (let i = 0; i < data.Participants.length; i++) {
            let participant = data.Participants[i];
            await db.Participant.create({
                teamId: team.id,
                fullName: participant.fullName || null,
                citizenId: participant.citizenId || null,
                phone: participant.phone || null,
                birth: participant.birth ? toDate(participant.birth) : new Date(),
                schoolName: participant.schoolName || null
            }, { transaction });
        }
        await upsertTeamRepresentatives(team.id, data, transaction);

        await db.Process.update({
            isUpdate: 1
        }, {
            where: {
                teamId: team.id
            },
            transaction
        });

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        return {
            EM: "Something went wrong, please try again",
            EC: 404,
            DT: ''
        }

    }
    try {
        let accountInfoTemp = await db.User.findOne({
            where: {
                id: data.userId
            },
            attributes: {
                exclude: ['password', 'updatedAt', 'createdAt']
            },
            raw: true
        });
        //console.log('check account: ', accountInfoTemp);
        let teamDataTemp = await db.Team.findOne({
            where: {
                userId: data.userId
            },
            attributes: ['id', 'teamName'],
            raw: true
        });
        //console.log('check team: ', teamDataTemp);
        let detailDataTemp = await db.Process.findOne({
            where: {
                teamId: team.id
            },
            attributes: ['paidImage', 'isPaid', 'isUpdate', 'isHighSchool', 'trainerName'],
            raw: true
        });
        //console.log('check detail: ', detailDataTemp);
        let participantDataTemp = await db.Participant.findAll({
            where: {
                teamId: team.id
            },
            attributes: ['id', 'fullName', 'citizenId', 'phone', 'birth', 'schoolName'],
            raw: true
        });
        let participantDataTemp2 = participantDataTemp.map(participant => {
            return {
                ...participant,
                birth: DateToString(participant.birth)
            }
        });
        const representatives = await getTeamRepresentativesMap(team.id);
        const coachName = getCoachName(detailDataTemp, representatives);
        //console.log('check parti: ', participantDataTemp);
        let dataTemp = {
            id: accountInfoTemp.id,
            email: accountInfoTemp.email,
            username: accountInfoTemp.username,
            role: accountInfoTemp.role,
            paidImage: detailDataTemp.paidImage,
            access_token: generateToken({ id: accountInfoTemp.id, email: accountInfoTemp.email, role: accountInfoTemp.role }),
            isPaid: detailDataTemp.isPaid,
            isUpdate: detailDataTemp.isUpdate,
            isHighSchool: detailDataTemp.isHighSchool,
            trainerName: coachName,
            trainerPhone: representatives?.[REPRESENTATIVE_ROLE.COACH]?.phone || null,
            representatives,
            teamName: teamDataTemp.teamName,
            Participants: [...participantDataTemp2]
        };
        return {
            EM: 'Update Success',
            EC: 0,
            DT: dataTemp
        }
    } catch (error) {
        return {
            EM: 'some thing went wrong',
            EC: 500,
            DT: ''
        }
    }
}
const apiSendHelpRequestService = async (userId, title, data) => {

    if (!userId || !userId.id) {
        return {
            EM: 'Unauthorized',
            EC: 401,
            DT: ''
        }
    }

    let team = await db.Team.findOne({
        where: {
            userId: userId.id
        },
        attributes: ['id'],
        raw: true
    });
    if (!team) {
        return {
            EM: 'User not found',
            EC: 404,
            DT: ''
        }
    }
    try {
        await db.Request.create({
            teamId: team.id,
            title: title,
            data: data,
            isSolve: false
        });
        return {
            EM: 'Send help request success',
            EC: 0,
            DT: ''
        }
    }
    catch (error) {
        return {
            EM: 'Send help request failed',
            EC: 500,
            DT: ''
        }
    }



}

const apiUploadPaymentProofService = async (data) => {
    if (!data || !data.userId) {
        return {
            EM: 'Unauthorized',
            EC: 401,
            DT: ''
        }
    }

    if (!data.paidImage || String(data.paidImage).trim() === '') {
        return {
            EM: 'Missing paid image',
            EC: 400,
            DT: ''
        }
    }

    let team = await db.Team.findOne({
        where: {
            userId: data.userId
        },
        attributes: ['id'],
        raw: true
    });

    if (!team) {
        return {
            EM: 'This user has not updated info yet',
            EC: 404,
            DT: ''
        }
    }

    let process = await db.Process.findOne({
        where: {
            teamId: team.id
        },
        raw: true
    });

    if (!process) {
        return {
            EM: 'There is something wrong, please try again',
            EC: 404,
            DT: ''
        }
    }

    if (process.isPaid === true) {
        return {
            EM: 'Payment has been confirmed before',
            EC: 400,
            DT: ''
        }
    }

    try {
        await db.Process.update({
            paidImage: data.paidImage,
            rejectionReason: null
        }, {
            where: {
                teamId: team.id
            }
        });

        return {
            EM: 'Upload payment proof success',
            EC: 0,
            DT: ''
        }
    } catch (error) {
        return {
            EM: 'Upload payment proof failed',
            EC: 500,
            DT: ''
        }
    }
}
const apiChangePasswordService = async (requester, password, newPassword) => {

    if (!requester || (!requester.id && !requester.email)) {
        return {
            EM: 'Unauthorized',
            EC: 401,
            DT: ''
        }
    }

    let user = await db.User.findOne({
        where: {
            ...(requester.id ? { id: requester.id } : { email: requester.email })
        },
        raw: true
    });
    if (!user) {
        return {
            EM: 'User not found',
            EC: 404,
            DT: ''
        }
    }
    let check = bycrypt.compareSync(password, user.password);
    if (!check) {
        return {
            EM: 'Password is incorrect',
            EC: 400,
            DT: ''
        }
    }
    let salt = bycrypt.genSaltSync(10);
    let hash = bycrypt.hashSync(newPassword, salt);
    try {
        await db.User.update({
            password: hash
        }, {
            where: {
                email: user.email
            }
        });
        return {
            EM: 'Change password success',
            EC: 0,
            DT: ''
        }
    } catch (error) {
        return {
            EM: 'Change password failed',
            EC: 500,
            DT: ''
        }
    }

}
const apiGetAllHelpRequestService = async (page, limit) => {
    let requests;
    if (page === 0 || limit === 0) {
        requests = await db.Request.findAndCountAll({
            attributes: ['id', 'title', 'data', 'isSolve'],
            include: [
                { model: db.Team, attributes: ['teamName'] }
            ],
            raw: true
        });
    }
    else {
        let offset = (page - 1) * limit;
        requests = await db.Request.findAndCountAll({
            attributes: ['id', 'title', 'data', 'isSolve'],
            include: [
                { model: db.Team, attributes: ['teamName'] }
            ],
            offset: offset,
            limit: limit,
            raw: true
        });
    }
    if (!requests) {
        return {
            EM: 'Request not found',
            EC: 404,
            DT: ''
        }
    }
    let data = requests.rows.map(request => {
        return {
            id: request.id,
            title: request.title,
            data: request.data,
            isSolve: request.isSolve,
            teamName: request['Team.teamName']
        }
    });
    return {
        EM: 'Get all help request success',
        EC: 0,
        DT: {
            count: requests.count,
            rows: data
        }
    }
}
const apiGetHelpRequestByIdService = async (id) => {
    let request = await db.Request.findOne({
        where: {
            id: id
        },
        attributes: ['id', 'title', 'data', 'isSolve', 'response'],
        raw: true,
        include: [
            { model: db.Team, attributes: ['teamName'] }
        ]
    });
    if (!request) {
        return {
            EM: 'Request not found',
            EC: 404,
            DT: ''
        }
    }
    let data = {
        id: request.id,
        title: request.title,
        data: request.data,
        isSolve: request.isSolve,
        response: request.response,
        teamName: request['Team.teamName']
    }

    return {
        EM: 'Get help request by id success',
        EC: 0,
        DT: data
    }

}
const apiSolveHelpRequestService = async (id, response) => {

    let request = await db.Request.findOne({
        where: {
            id: id
        },
        raw: true
    });

    if (!request) {
        return {
            EM: 'Request not found',
            EC: 404,
            DT: ''
        }
    }
    if (request.isSolve === 1) {
        return {
            EM: 'Request has been solved',
            EC: 400,
            DT: ''
        }
    }
    try {
        await db.Request.update({
            isSolve: 1,
            response: response
        }, {
            where: {
                id: id
            }
        });
        return {
            EM: 'Solve help request success',
            EC: 0,
            DT: ''
        }
    } catch (error) {
        return {
            EM: 'Solve help request failed',
            EC: 500,
            DT: ''
        }
    }

}
const apiDeleteHelpRequestService = async (id, requester) => {
    let request = await db.Request.findOne({
        where: {
            id: id
        },
        raw: true
    });
    if (!request) {
        return {
            EM: 'Request not found',
            EC: 404,
            DT: ''
        }
    }

    if (!requester || !requester.role || !requester.email) {
        return {
            EM: 'Unauthorized',
            EC: 401,
            DT: ''
        }
    }

    if (requester.role === 'USER') {
        const user = await db.User.findOne({
            where: {
                email: requester.email
            },
            attributes: ['id'],
            raw: true
        });

        if (!user) {
            return {
                EM: 'User not found',
                EC: 404,
                DT: ''
            }
        }

        const team = await db.Team.findOne({
            where: {
                userId: user.id
            },
            attributes: ['id'],
            raw: true
        });

        if (!team || request.teamId !== team.id) {
            return {
                EM: 'You are not allowed to delete this request',
                EC: 403,
                DT: ''
            }
        }
    } else if (requester.role !== 'ADMIN') {
        return {
            EM: 'You are not allowed to delete this request',
            EC: 403,
            DT: ''
        }
    }

    try {
        await db.Request.destroy({
            where: {
                id: id
            }
        });
        return {
            EM: 'Delete help request success',
            EC: 0,
            DT: ''
        }
    } catch (error) {
        return {
            EM: 'Delete help request failed',
            EC: 500,
            DT: ''
        }
    }
}
const apiGetAllUsersService = async (page, limit) => {
    let users = {};
    if (limit === 0 || page === 0) {
        users = await db.User.findAndCountAll({
            attributes: ['id', 'email', 'username', 'role'],
            include: [
                {
                    model: db.Team,
                    attributes: ['teamName'],
                }
            ],
            raw: true
        });

    } else {
        let offset = (page - 1) * limit;
        users = await db.User.findAndCountAll({
            attributes: ['id', 'email', 'username', 'role'],
            include: [
                {
                    model: db.Team,
                    attributes: ['teamName'],
                }
            ],
            offset: offset,
            limit: limit,
            raw: true
        });
    }

    if (!users) {
        return {
            EM: 'There is no user registered',
            EC: 404,
            DT: ''
        }
    }
    let data = users.rows.map(user => {
        return {
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
            teamName: user['Team.teamName'] || 'Not updated yet / admin account'
        }
    });

    return {
        EM: 'Get users success',
        EC: 0,
        DT: {
            count: users.count,
            rows: data
        }
    }

}
const apiGetUserByIdService = async (id) => {
    let user = await db.User.findOne({
        where: {
            id: id
        },
        raw: true
    });
    if (!user) {
        return {
            EM: 'User not found',
            EC: 404,
            DT: ''
        }
    }
    let accountInfo = await db.User.findOne({
        where: {
            id: user.id
        },
        attributes: {
            exclude: ['password', 'updatedAt', 'createdAt']
        },
        raw: true
    });

    let teamData = await db.Team.findOne({
        where: {
            userId: accountInfo.id
        },
        attributes: ['id', 'teamName'],
        raw: true
    });

    if (teamData === null) {
        let noTeamData = {
            "id": accountInfo.id,
            "email": accountInfo.email,
            "username": accountInfo.username,
            "role": accountInfo.role,
            "teamName": 'Not updated yet / admin account',
            "Participants": []
        }
        return {
            EM: 'Get user by id success',
            EC: 0,
            DT: noTeamData
        }

    } else {
        let detailData = await db.Process.findOne({
            where: {
                teamId: teamData.id
            },
            attributes: ['paidImage', 'isPaid', 'isUpdate', 'isHighSchool', 'trainerName', 'rejectionReason'],
            raw: true
        });
        let participantData = await db.Participant.findAll({
            where: {
                teamId: teamData.id
            },
            attributes: ['id', 'fullName', 'citizenId', 'phone', 'birth', 'schoolName'],
            raw: true
        });
        let participantData2 = participantData.map(participant => {
            return {
                ...participant,
                birth: DateToString(participant.birth)
            }
        });
        const representatives = await getTeamRepresentativesMap(teamData.id);
        const coachName = getCoachName(detailData, representatives);

        let data = {
            id: accountInfo.id,
            email: accountInfo.email,
            username: accountInfo.username,
            role: accountInfo.role,
            paidImage: detailData.paidImage,
            isPaid: detailData.isPaid,
            isUpdate: detailData.isUpdate,
            isHighSchool: detailData.isHighSchool,
            trainerName: coachName,
            trainerPhone: representatives?.[REPRESENTATIVE_ROLE.COACH]?.phone || null,
            representatives,
            rejectionReason: detailData.rejectionReason,
            teamName: teamData.teamName,
            Participants: [...participantData2]
        };

        return {
            EM: 'Get user by id success',
            EC: 0,
            DT: data
        }
    }
}
const apiDeleteUserService = async (id) => {
    if (id === 1) {
        return {
            EM: 'Cannot delete admin account',
            EC: 400,
            DT: ''
        }
    }
    let transaction;
    try {
        transaction = await db.sequelize.transaction();
        let user = await db.User.findOne({
            where: {
                id: id
            },
            transaction
        });
        if (!user) {
            await transaction.rollback();
            return {
                EM: 'User not found',
                EC: 404,
                DT: ''
            }
        }
        let team = await db.Team.findOne({
            where: {
                userId: id
            },
            transaction
        });
        let teamId = team ? team.id : null;

        if (teamId) {
            await db.Process.destroy({ where: { teamId: teamId }, transaction });
            await db.Participant.destroy({ where: { teamId: teamId }, transaction });
            await db.Representative.destroy({ where: { teamId: teamId }, transaction });
            await db.Request.destroy({ where: { teamId: teamId }, transaction });
            await db.Team.destroy({ where: { userId: id }, transaction });
        }

        await db.User.destroy({ where: { id: id }, transaction });
        await transaction.commit();

        return {
            EM: 'Delete user success',
            EC: 0,
            DT: ''
        }
    } catch (error) {
        if (transaction) {
            await transaction.rollback();
        }
        return {
            EM: 'Delete user failed',
            EC: 500,
            DT: ''
        }
    }
}
const apiResetPasswordService = async (id) => {

    let user = await db.User.findOne({
        where: {
            id: id
        },
        raw: true
    });
    if (!user) {
        return {
            EM: 'User not found',
            EC: 404,
            DT: ''
        }
    }
    let salt = bycrypt.genSaltSync(10);
    let hash = bycrypt.hashSync('123456', salt);
    try {
        await db.User.update({
            password: hash
        }, {
            where: {
                id: id
            }
        });
        await createWL(user.email);
        return {
            EM: 'Reset password success',
            EC: 0,
            DT: ''
        }
    } catch (error) {
        return {
            EM: 'Reset password failed',
            EC: 500,
            DT: ''
        }
    }
}
const apiConfirmPaymentService = async (id) => {
    let user = await db.User.findOne({
        where: {
            id: id
        },
        raw: true,
        attributes: ['email'],
    });
    if (!user) {
        return {
            EM: 'User not found',
            EC: 404,
            DT: ''
        }
    }
    let team = await db.Team.findOne({
        where: {
            userId: id
        },
        raw: true
    });
    if (!team) {
        return {
            EM: 'This user has not updated info yet',
            EC: 404,
            DT: ''
        }
    }
    let process = await db.Process.findOne({
        where: {
            teamId: team.id
        },
        raw: true
    });
    if (!process) {
        return {
            EM: 'There is something wrong, please try again',
            EC: 404,
            DT: ''
        }
    }
    if (process.isPaid === 1) {
        return {
            EM: 'Payment has been confirmed before',
            EC: 400,
            DT: ''
        }
    }
    try {
        await db.Process.update({
            isPaid: 1
        }, {
            where: {
                teamId: team.id
            }
        });
        let title = 'Payment Confirmed';
        let htmlContent = '';
        try {
            let id_template = await db.Settemplate.findOne({
                where: {
                    type: 'PAYMENT'
                },
                attributes: ['id_template'],
                raw: true
            });
            let template = await db.Template.findOne({
                where: {
                    id: id_template.id_template
                },
                attributes: ['data'],
                raw: true
            });
            htmlContent = template.data;
        } catch (error) {
            return {
                EM: "Something went wrong with email",
                EC: 500,
                DT: ''
            }
        }
        await apiSendingEmailService(user.email, title, htmlContent);
        return {
            EM: 'Confirm payment success',
            EC: 0,
            DT: ''
        }
    } catch (error) {
        return {
            EM: 'Confirm payment failed',
            EC: 500,
            DT: ''
        }
    }
}
const apiSearchByEmailService = async (email) => {
    if (!email) {
        return {
            EM: 'Missing email',
            EC: 400,
            DT: ''
        }
    }
    let user = await db.User.findAndCountAll({
        where: {
            email: {
                [Op.like]: `%${email}%`
            }
        },
        include: [
            {
                model: db.Team,
                attributes: ['teamName'],
            }
        ],
        attributes: {
            exclude: ['password', 'updatedAt', 'createdAt']
        },
        raw: true
    });
    if (!user) {
        return {
            EM: 'User not found',
            EC: 404,
            DT: ''
        }
    }
    let listUser = user.rows.map(user => {
        return {
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
            teamName: user['Team.teamName'] || 'Not updated yet / admin account'
        }
    });

    return {
        EM: 'Search user by email success',
        EC: 0,
        DT: {
            count: user.count,
            rows: listUser
        }
    }
}
const apiPrepareCSV = async () => {

    let users = await db.User.findAll({
        attributes: ['id', 'email', 'username', 'role'],
        where: {
            role: 'USER'
        },
        include: [
            {
                model: db.Team,
                attributes: ['teamName'],
                include: [
                    {
                        model: db.Process,
                        attributes: ['isPaid', 'isUpdate', 'isHighSchool', 'trainerName']
                    },
                    {
                        model: db.Participant,
                        attributes: ['fullName', 'citizenId', 'phone', 'birth', 'schoolName']
                    }
                ]
            }
        ],
        raw: true
    });
    if (!users) {
        return {
            EM: 'There is no user registered',
            EC: 404,
            DT: ''
        }
    }
    // Mảng để lưu trữ các team đã nhóm lại
    let teamsArray = [];

    // Object để lưu trữ team theo id
    let teamObject = {};
    // Duyệt qua kết quả từ cơ sở dữ liệu
    users.forEach(result => {
        const teamId = result.id;

        // Nếu teamObject không có đối tượng với id tương ứng thì tạo mới
        if (!teamObject[teamId]) {
            teamObject[teamId] = {
                id: teamId,
                email: result.email,
                username: result.username,
                role: result.role,
                teamName: result['Team.teamName'] || 'Not updated yet / admin account',
                isPaid: result['Team.Process.isPaid'] || false,
                isUpdate: result['Team.Process.isUpdate'] || false,
                isHighSchool: result['Team.Process.isHighSchool'] || false,
                trainerName: result['Team.Process.trainerName'],
                participants: []
            };
        }

        // Thêm participant vào mảng participants của teamObject
        const participant = {
            fullName: result['Team.Participants.fullName'],
            citizenId: result['Team.Participants.citizenId'],
            phone: result['Team.Participants.phone'],
            birth: result['Team.Participants.birth'] ? DateToString(result['Team.Participants.birth']) : result['Team.Participants.birth'],
            schoolName: result['Team.Participants.schoolName']
        };

        teamObject[teamId].participants.push(participant);
    });


    // Duyệt qua các team trong teamObject
    Object.values(teamObject).forEach(team => {
        // Lặp qua từng participant trong mảng participants của team
        for (let i = 0; i < 3; i++) {
            if (!team.participants[i]) {
                team[`participant${i + 1}_fullName`] = null;
                team[`participant${i + 1}_citizenId`] = null;
                team[`participant${i + 1}_phone`] = null;
                team[`participant${i + 1}_birth`] = null;
                team[`participant${i + 1}_schoolName`] = null;
                continue;
            }
            const participant = team.participants[i];

            // Thêm thông tin của từng participant vào đối tượng teamObject
            team[`participant${i + 1}_fullName`] = participant.fullName ? participant.fullName : null;
            team[`participant${i + 1}_citizenId`] = participant.citizenId ? participant.citizenId : null;
            team[`participant${i + 1}_phone`] = participant.phone ? participant.phone : null;
            team[`participant${i + 1}_birth`] = participant.birth ? participant.birth : null;
            team[`participant${i + 1}_schoolName`] = participant.schoolName ? participant.schoolName : null;
        }
        // Xóa mảng participants khỏi đối tượng teamObject
        delete team.participants;
    });
    teamsArray = Object.values(teamObject);
    // Chuyển đổi teamObject thành mảng gồm các đối tượng nhóm lại theo id
    try {
        const csvStream = csv.format({ headers: true, delimiter: ';' });
        const writableStream = fs.createWriteStream('user_data.csv', { encoding: 'utf8' });
        writableStream.write('\ufeff'); // BOM (Byte Order Mark) để mở file CSV bằng Excel không bị lỗi font
        csvStream.pipe(writableStream);

        // Sử dụng Promise.all để đợi cho tất cả các dòng dữ liệu được viết vào writable stream
        await Promise.all(teamsArray.map(row => new Promise((resolve, reject) => {
            csvStream.write(row, (err) => {
                if (err) reject(err);
                else resolve();
            });
        })));

        // Kết thúc việc viết dữ liệu
        csvStream.end();

        // Chờ cho sự kiện 'finish' của writable stream để biết khi nào việc tạo file CSV hoàn thành
        await new Promise((resolve, reject) => {
            writableStream.on('finish', () => {
                console.log('CSV file created successfully');
                resolve('user_data.csv');
            });

            writableStream.on('error', (err) => {
                console.error('Error creating CSV file:', err);
                reject(err);
            });
        });
        return {
            EM: 'Prepare CSV success',
            EC: 0,
            DT: 'user_data.csv'
        }
    } catch (err) {
        console.error('Error creating CSV file:', err);
        throw err;
    }

}
const apiUpdateUserByAdminService = async (data) => {
    /**
     * data = {
     *    userId: '',
     *    teamName: '',
     *    paidImage: '',
     *    isHighSchool: '',
     *    trainerName: '',
     *    Participants: [
     *       {
     *          fullName: '',
     *          citizenId: '',
     *          phone: '',
     *          birth: '', //dd/mm/yyyy
     *          schoolName: ''
     *       }
     *    ]
     * }
     */
    const toDate = (date) => {
        const [day, month, year] = date.split("/").map(Number);
        return new Date(year, month - 1, day);
    }
    let user = await db.User.findOne({ where: { id: data.userId }, raw: true });

    if (!user) {
        return {
            EM: 'User not found',
            EC: 404,
            DT: ''
        }
    }
    let transaction;
    try {
        transaction = await db.sequelize.transaction();
        await db.User.update({ email: data.email, username: data.username }, { where: { id: data.userId }, transaction });

        let team = await db.Team.findOne({ where: { userId: data.userId }, transaction });

        if (!team) {
            team = await db.Team.create({ userId: data.userId, teamName: data.teamName }, { transaction });
        }
        else {
            await db.Team.update({ teamName: data.teamName }, { where: { userId: data.userId }, transaction });
        }
        let participants = await db.Participant.findAll({ where: { teamId: team.id }, order: [['id', 'ASC']], transaction });

        for (let i = 0; i < data.Participants.length; i++) {
            let participant = data.Participants[i];
            let payload = {
                fullName: participant.fullName || null,
                citizenId: participant.citizenId || null,
                phone: participant.phone || null,
                birth: participant.birth ? toDate(participant.birth) : new Date(),
                schoolName: participant.schoolName || null
            };

            if (participants[i]) {
                await db.Participant.update(payload, {
                    where: { id: participants[i].id },
                    transaction
                });
            } else {
                await db.Participant.create({
                    teamId: team.id,
                    ...payload
                }, { transaction });
            }
        }

        if (participants.length > data.Participants.length) {
            const extraParticipantIds = participants
                .slice(data.Participants.length)
                .map((item) => item.id);

            await db.Participant.destroy({
                where: { id: extraParticipantIds },
                transaction
            });
        }
        let detail = await db.Process.findOne({ where: { teamId: team.id }, transaction });

        if (!detail) {
            await db.Process.create({
                teamId: team.id,
                paidImage: data.paidImage ? data.paidImage : null,
                isPaid: false,
                isHighSchool: data.isHighSchool === 'true' ? true : false,
                trainerName: buildCoachRepresentativePayload(data).fullName,
                isUpdate: 1
            }, { transaction });
        } else {
            await db.Process.update({
                paidImage: data.paidImage ? data.paidImage : null,
                isHighSchool: data.isHighSchool === 'true' ? true : false,
                trainerName: buildCoachRepresentativePayload(data).fullName,
                isUpdate: 1
            }, {
                where: { teamId: team.id },
                transaction
            });
        }

        await upsertTeamRepresentatives(team.id, data, transaction);

        await transaction.commit();
    } catch (error) {
        if (transaction) {
            await transaction.rollback();
        }
        return {
            EM: 'Update user by admin failed',
            EC: 500,
            DT: ''
        }
    }

    return {
        EM: 'Update user by admin success',
        EC: 0,
        DT: ''
    }
}
const apiGetUnpaidTeamsService = async (isUpdatedImage) => {
    let teams = [];
    if (isUpdatedImage) {
        teams = await db.Team.findAll({
            attributes: ['userId', 'teamName'],
            include: [
                {
                    model: db.Process,
                    where:
                    {
                        isPaid: { [Op.eq]: false },
                        paidImage: { [Op.not]: null }, // paidImage khác rỗng ('')
                    }
                }
            ],
            raw: true
        });
    }
    else {
        teams = await db.Team.findAll({
            attributes: ['userId', 'teamName'],
            include: [
                {
                    model: db.Process,
                    where: {
                        isPaid: false
                    }
                }
            ],
            raw: true
        });
    }


    if (teams.length === 0) {
        if (isUpdatedImage) {
            return {
                EM: 'There is no unpaid team with updated image',
                EC: -1,
                DT: ''
            }
        }
        return {
            EM: 'There is no unpaid team',
            EC: -1,
            DT: ''
        }
    }

    let users = await db.User.findAll({
        where: {
            id: teams.map(team => team.userId)
        },
        attributes: ['id', 'email', 'username', 'role'],
        raw: true
    });
    users = users.map(user => {
        return {
            ...user,
            teamName: teams.find(team => team.userId === user.id).teamName || 'Not updated yet / admin account'
        }
    });
    console.log('check users: ', users);
    let resp = {
        EM: 'Get unpaid teams success',
        EC: 0,
        DT: {
            count: users.length,
            rows: users
        }
    }
    return resp
}
const apiGetUnSolvedRequestsService = async () => {
    let requests = await db.Request.findAll({
        where: {
            isSolve: false
        },
        attributes: ['id', 'title', 'data'],
        include: [
            {
                model: db.Team,
                attributes: ['teamName']
            }
        ],
        raw: true
    });
    if (requests.length === 0) {
        return {
            EM: 'There is no unsolved request',
            EC: -1,
            DT: ''
        }
    }
    requests = requests.map(request => {
        return {
            id: request.id,
            title: request.title,
            data: request.data,
            teamName: request['Team.teamName']
        }
    });
    return {
        EM: 'Get unsolved requests success',
        EC: 0,
        DT: requests
    }

}
const apiGetHasNotUpdatedInfoService = async () => {

    let teamIds = await db.Process.findAll({
        where: {
            isUpdate: false
        },
        attributes: ['teamId'],
        raw: true
    });
    if (teamIds.length === 0) {
        return {
            EM: 'There is no team has not updated info',
            EC: -1,
            DT: ''
        }
    }
    let users = await db.User.findAll({
        include: [
            {
                model: db.Team,
                attributes: ['teamName'],
                where: {
                    id: teamIds.map(team => team.teamId)
                }
            }
        ],
        attributes: ['id', 'email', 'username', 'role'],
        raw: true
    });
    users = users.map(user => {
        let teamName = user['Team.teamName'];
        delete user['Team.teamName'];
        return {
            ...user,
            teamName: teamName ? teamName : 'Not updated yet / admin account'
        }
    });
    console.log('check users: ', users);

    return {
        EM: 'Get teams has not updated info success',
        EC: 0,
        DT: users
    }

}
const apiForgotPasswordService = async (email) => {
    let user = await db.User.findOne({
        attributes: ['id'],
        where: {
            email: email
        },
        raw: true
    });
    if (!user) {
        return {
            EM: 'User not found',
            EC: 404,
            DT: ''
        }
    }
    let checkPIN = await db.PIN.findOne({
        where: {
            email: email
        },
        raw: true
    });
    if (checkPIN) {
        await db.PIN.destroy({
            where: {
                email: email
            }
        });
    }

    let PIN = generatePIN(6);

    let token = generateToken({ email: email, role: 'RESET_PASSWORD', PIN: PIN });
    let htmlContent = '';
    try {
        let id_template = await db.Settemplate.findOne({
            where: {
                type: 'FORGOT_PASSWORD'
            },
            attributes: ['id_template'],
            raw: true
        });
        htmlContent = await db.Template.findOne({
            where: {
                id: id_template.id_template
            },
            attributes: ['data'],
            raw: true
        });
    } catch (error) {
        return {
            EM: "Something went wrong with email",
            EC: 500,
            DT: ''
        }
    }

    let dynamicData = {
        PIN: PIN
    }

    let htmlContentCopy = ReplaceVariable(htmlContent.data, dynamicData);

    let title = 'Reset Password';
    try {
        await apiSendingEmailService(email, title, htmlContentCopy);
        let result = await db.PIN.create({
            email: email,
            PINToken: token
        });
        console.log('check result: ', result);
        return {
            EM: 'Send email success',
            EC: 0,
            DT: ''
        }
    } catch (error) {
        return {
            EM: 'Send email failed',
            EC: 500,
            DT: ''
        }
    }


}
const apiResetPasswordByUserService = async (email, PIN, newPassword) => {

    let checkPIN = await db.PIN.findOne({
        where: {
            email: email
        },
        raw: true
    });

    if (!checkPIN) {
        return {
            EM: 'PIN not found, please request a new one',
            EC: 400,
            DT: ''
        }
    }

    let checkPinToken = verifyToken(`Bearer ${checkPIN.PINToken}`);

    if (checkPinToken.EC !== 0 && checkPinToken.EM === 'jwt expired') {
        return {
            EC: -999,
            EM: "Your PIN is expired, please try again!",
            DT: ""
        };
    }

    if (checkPinToken.DT.PIN !== PIN) {
        return {
            EM: 'PIN is incorrect',
            EC: 400,
            DT: ''
        }
    }

    let salt = bycrypt.genSaltSync(10);
    let hash = bycrypt.hashSync(newPassword, salt);
    try {
        await db.User.update({
            password: hash
        }, {
            where: {
                email: email
            }
        });
        await db.PIN.destroy({
            where: {
                email: email
            }
        });
        await createWL(email);
        return {
            EM: 'Reset password success',
            EC: 0,
            DT: ''
        }
    } catch (error) {
        return {
            EM: 'Reset password failed',
            EC: 500,
            DT: ''
        }
    }
}

const getTeamStatusFromProcess = (process) => {
    if (process?.isUpdate === true && process?.isPaid === true) {
        return 'Đã duyệt';
    }

    if (process?.isUpdate === true) {
        return 'Chờ duyệt';
    }

    return 'Khởi tạo';
}

const mapStatusToProcessFlags = (status, rejectionReason) => {
    if (status === 'Đã duyệt') {
        return {
            isUpdate: true,
            isPaid: true,
            rejectionReason: null
        };
    }

    if (status === 'Chờ duyệt') {
        return {
            isUpdate: true,
            isPaid: false,
            rejectionReason: rejectionReason && String(rejectionReason).trim().length > 0
                ? String(rejectionReason).trim()
                : null
        };
    }

    if (status === 'Khởi tạo') {
        return {
            isUpdate: false,
            isPaid: false,
            rejectionReason: null
        };
    }

    return null;
}

const buildTeamSchoolLabel = (participantRows, fallbackIsHighSchool) => {
    const schoolSet = new Set();

    participantRows.forEach((participant) => {
        const schoolName = (participant.schoolName || '').trim();
        if (schoolName) {
            schoolSet.add(schoolName);
        }
    });

    const schools = Array.from(schoolSet);
    if (schools.length > 0) {
        return schools.join('\n');
    }

    return fallbackIsHighSchool ? 'Khối THPT' : 'Khối Đại học';
}

const apiGetDashBoardService = async () => {

    /**
     * totalUser
     * totalUpdatedInfo
     * totalPaid
     *
     */
    try {
        const totalUser = await db.User.count({
            where: {
                role: 'USER'
            }
        });

        const totalUpdatedInfo = await db.Process.count({
            where: {
                isUpdate: true
            }
        });

        const totalPaid = await db.Process.count({
            where: {
                isPaid: true
            }
        });

        const dashboardUsers = await db.User.findAll({
            where: {
                role: 'USER'
            },
            attributes: ['id', 'email', 'username'],
            include: [
                {
                    model: db.Team,
                    attributes: ['id', 'teamName'],
                    required: false,
                    include: [
                        {
                            model: db.Process,
                            attributes: ['isPaid', 'isUpdate'],
                            required: false
                        }
                    ]
                }
            ],
            raw: true
        });

        const unpaidAccounts = dashboardUsers
            .filter((user) => user['Team.Process.isPaid'] !== true)
            .map((user) => {
                const process = {
                    isPaid: user['Team.Process.isPaid'],
                    isUpdate: user['Team.Process.isUpdate']
                };

                return {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    teamName: user['Team.teamName'] && user['Team.teamName'].trim().length > 0
                        ? user['Team.teamName']
                        : 'Chưa cập nhật',
                    status: getTeamStatusFromProcess(process)
                };
            });

        const totalUnpaid = unpaidAccounts.length;

        const totalUnsolvedRequest = await db.Request.count({
            where: {
                isSolve: false
            }
        });

        const totalUnupdatedInfo = await db.Process.count({
            where: {
                isUpdate: false
            }
        });

        const totalRegisteredTeams = await db.Team.count({
            where: {
                teamName: {
                    [Op.not]: null
                }
            }
        });

        const participantSchools = await db.Participant.findAll({
            where: {
                schoolName: {
                    [Op.not]: null,
                    [Op.ne]: ''
                }
            },
            attributes: ['teamId', 'schoolName'],
            raw: true
        });

        const processRows = await db.Process.findAll({
            attributes: ['teamId', 'isHighSchool'],
            raw: true
        });

        const teamBlockMap = new Map();
        processRows.forEach((processItem) => {
            teamBlockMap.set(processItem.teamId, processItem.isHighSchool);
        });

        const allSchoolSet = new Set();
        const highSchoolSet = new Set();
        const universitySet = new Set();
        const schoolTeamsMap = new Map();

        participantSchools.forEach((item) => {
            const schoolName = (item.schoolName || '').trim();
            if (!schoolName) {
                return;
            }

            const teamId = item.teamId;
            if (!schoolTeamsMap.has(schoolName)) {
                schoolTeamsMap.set(schoolName, new Set());
            }

            if (teamId) {
                schoolTeamsMap.get(schoolName).add(teamId);
            }

            allSchoolSet.add(schoolName);

            const isHighSchool = teamBlockMap.get(teamId);

            if (isHighSchool === true) {
                highSchoolSet.add(schoolName);
                return;
            }

            if (isHighSchool === false) {
                universitySet.add(schoolName);
            }
        });

        const totalSchools = allSchoolSet.size;
        const totalHighSchool = highSchoolSet.size;
        const totalUniversity = universitySet.size;
        const participatingSchools = Array.from(schoolTeamsMap.entries())
            .map(([name, teamIds]) => ({
                name,
                teams: teamIds.size
            }))
            .sort((left, right) => {
                if (right.teams !== left.teams) {
                    return right.teams - left.teams;
                }

                return left.name.localeCompare(right.name, 'vi');
            });

        const allTeams = await db.Team.findAll({
            where: {
                teamName: {
                    [Op.not]: null
                }
            },
            attributes: ['id', 'teamName', 'createdAt', 'updatedAt'],
            order: [['updatedAt', 'DESC']],
            raw: true
        });

        const allTeamsData = await Promise.all(allTeams.map(async (team) => {
            const process = await db.Process.findOne({
                where: {
                    teamId: team.id
                },
                attributes: ['isPaid', 'isUpdate', 'isHighSchool', 'trainerName'],
                raw: true
            });
            const representatives = await getTeamRepresentativesMap(team.id);

            const participants = await db.Participant.findAll({
                where: {
                    teamId: team.id,
                    schoolName: {
                        [Op.not]: null
                    }
                },
                attributes: ['schoolName'],
                order: [['createdAt', 'ASC']],
                raw: true
            });

            const status = getTeamStatusFromProcess(process);

            return {
                id: team.id,
                name: team.teamName,
                coach: representatives?.[REPRESENTATIVE_ROLE.COACH]?.fullName || process?.trainerName || 'Chưa cập nhật',
                school: buildTeamSchoolLabel(participants, process?.isHighSchool),
                status,
                createdAt: team.createdAt,
                updatedAt: team.updatedAt
            };
        }));

        const recentTeams = allTeamsData.slice(0, 5);

        const data = {
            // Keep legacy keys for backward compatibility.
            totalUser,
            totalUpdatedInfo,
            totalPaid,
            totalUnpaid,
            totalUnsolvedRequest,
            totalUnupdatedInfo,
            // Additional dashboard data for the new admin UI.
            totalRegisteredTeams,
            totalSchools,
            totalHighSchool,
            totalUniversity,
            participatingSchools,
            unpaidAccounts,
            recentTeams,
            allTeams: allTeamsData
        };

        return {
            EM: 'Get dashboard success',
            EC: 0,
            DT: data
        }
    }
    catch (error) {
        return {
            EM: 'Get dashboard failed',
            EC: 500,
            DT: error
        }
    }
}
const apiGetTeamDetailService = async (teamId) => {
    if (!teamId || Number.isNaN(Number(teamId))) {
        return {
            EM: 'Invalid team id',
            EC: 400,
            DT: ''
        };
    }

    try {
        const team = await db.Team.findOne({
            where: {
                id: teamId
            },
            attributes: ['id', 'userId', 'teamName', 'createdAt', 'updatedAt'],
            raw: true
        });

        if (!team) {
            return {
                EM: 'Team not found',
                EC: 404,
                DT: ''
            };
        }

        const process = await db.Process.findOne({
            where: {
                teamId: team.id
            },
            attributes: ['paidImage', 'isPaid', 'isUpdate', 'isHighSchool', 'trainerName', 'rejectionReason'],
            raw: true
        });

        const participants = await db.Participant.findAll({
            where: {
                teamId: team.id
            },
            attributes: ['id', 'fullName', 'citizenId', 'phone', 'birth', 'schoolName'],
            order: [['createdAt', 'ASC']],
            raw: true
        });

        const participantsData = participants.map((participant) => ({
            ...participant,
            birth: participant.birth ? DateToString(new Date(participant.birth)) : null
        }));
        const representatives = await getTeamRepresentativesMap(team.id);

        const status = getTeamStatusFromProcess(process);

        const school = buildTeamSchoolLabel(participantsData, process?.isHighSchool);

        return {
            EM: 'Get team detail success',
            EC: 0,
            DT: {
                id: team.id,
                userId: team.userId,
                teamName: team.teamName,
                coach: representatives?.[REPRESENTATIVE_ROLE.COACH]?.fullName || process?.trainerName || 'Chưa cập nhật',
                coachPhone: representatives?.[REPRESENTATIVE_ROLE.COACH]?.phone || null,
                representative: {
                    leader: representatives?.[REPRESENTATIVE_ROLE.LEADER] || null,
                    coach: representatives?.[REPRESENTATIVE_ROLE.COACH] || null
                },
                school,
                paidImage: process?.paidImage || null,
                isPaid: process?.isPaid ?? null,
                rejectionReason: process?.rejectionReason || null,
                isHighSchool: process?.isHighSchool ?? null,
                status,
                participants: participantsData,
                createdAt: team.createdAt,
                updatedAt: team.updatedAt
            }
        };
    } catch (error) {
        return {
            EM: 'Get team detail failed',
            EC: 500,
            DT: ''
        };
    }
}
const apiDeleteTeamService = async (teamId) => {
    if (!teamId || Number.isNaN(Number(teamId))) {
        return {
            EM: 'Invalid team id',
            EC: 400,
            DT: ''
        };
    }

    const transaction = await db.sequelize.transaction();

    try {
        const team = await db.Team.findOne({
            where: {
                id: teamId
            },
            attributes: ['id'],
            raw: true,
            transaction
        });

        if (!team) {
            await transaction.rollback();
            return {
                EM: 'Team not found',
                EC: 404,
                DT: ''
            };
        }

        await db.Participant.destroy({
            where: {
                teamId: team.id
            },
            transaction
        });

        await db.Request.destroy({
            where: {
                teamId: team.id
            },
            transaction
        });

        await db.Process.destroy({
            where: {
                teamId: team.id
            },
            transaction
        });

        await db.Representative.destroy({
            where: {
                teamId: team.id
            },
            transaction
        });

        await db.Team.destroy({
            where: {
                id: team.id
            },
            transaction
        });

        await transaction.commit();

        return {
            EM: 'Delete team success',
            EC: 0,
            DT: ''
        };
    } catch (error) {
        await transaction.rollback();
        return {
            EM: 'Delete team failed',
            EC: 500,
            DT: ''
        };
    }
}

const apiUpdateTeamStatusService = async (teamId, status, rejectionReason) => {
    if (!teamId || Number.isNaN(Number(teamId))) {
        return {
            EM: 'Invalid team id',
            EC: 400,
            DT: ''
        };
    }

    const mappedFlags = mapStatusToProcessFlags(status, rejectionReason);
    if (!mappedFlags) {
        return {
            EM: 'Invalid status',
            EC: 400,
            DT: ''
        };
    }

    const transaction = await db.sequelize.transaction();

    try {
        const team = await db.Team.findOne({
            where: {
                id: teamId
            },
            attributes: ['id'],
            transaction
        });

        if (!team) {
            await transaction.rollback();
            return {
                EM: 'Team not found',
                EC: 404,
                DT: ''
            };
        }

        const process = await db.Process.findOne({
            where: {
                teamId: team.id
            },
            attributes: ['id'],
            transaction
        });

        if (!process) {
            await db.Process.create({
                teamId: team.id,
                paidImage: null,
                isHighSchool: false,
                trainerName: null,
                ...mappedFlags
            }, { transaction });
        }
        else {
            await db.Process.update({
                ...mappedFlags
            }, {
                where: {
                    teamId: team.id
                },
                transaction
            });
        }

        await transaction.commit();

        return {
            EM: 'Update team status success',
            EC: 0,
            DT: {
                teamId: Number(teamId),
                status,
                ...mappedFlags
            }
        };
    } catch (error) {
        await transaction.rollback();
        return {
            EM: 'Update team status failed',
            EC: 500,
            DT: ''
        };
    }
}
const apiGetHelpByUserService = async (userId) => {
    let team = await db.Team.findOne({
        where: {
            userId: userId
        },
        raw: true
    });
    if (!team) {
        return {
            EM: 'User not found',
            EC: 404,
            DT: ''
        }
    }
    let requests = await db.Request.findAll({
        where: {
            teamId: team.id
        },
        attributes: ['id', 'title', 'data', 'response', 'isSolve'],
        raw: true
    });
    if (requests.length === 0) {
        return {
            EM: 'There is no help request',
            EC: -1,
            DT: ''
        }
    }
    requests = requests.map(request => {
        return {
            id: request.id,
            title: request.title,
            data: request.data,
            response: request.response || "No response yet",
            isSolve: request.isSolve
        }
    });
    return {
        EM: 'Get help by user success',
        EC: 0,
        DT: requests
    }
}
const apiSaveTemplateMailService = async (template_name, data) => {

    const options = {
        collapseBooleanAttributes: true,
        collapseWhitespace: true,
        decodeEntities: true,
        html5: true,
        minifyCSS: true,
        minifyJS: true,
        processConditionalComments: true,
        removeAttributeQuotes: true,
        removeComments: true,
        removeEmptyAttributes: true,
        removeOptionalTags: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true,
        sortClassName: true,
        sortAttributes: true,
        quoteCharacter: "'", // single quote
        trimCustomFragments: true,
        processScripts: ['text/html'],
        ignoreCustomFragments: [/<%[\s\S]*?%>/, /<\?[\s\S]*?\?>/]
    }

    let tempData = htmlMinifier.minify(data, options);
    let template = await db.Template.create({
        template_name: template_name,
        data: tempData
    });
    if (!template) {
        return {
            EM: 'Save template mail failed',
            EC: 500,
            DT: ''
        }
    }
    console.log('Im here')
    return {
        EM: 'Save template mail success',
        EC: 0,
        DT: ''
    }
}
const apiGetTemplateMailService = async () => {
    let templates = await db.Template.findAll({
        attributes: ['id', 'template_name'],
        include: [{
            model: db.Settemplate,
            attributes: ['type']
        }],
        raw: true
    });
    if (templates.length === 0) {
        return {
            EM: 'There is no template mail',
            EC: -1,
            DT: ''
        }
    }
    let templatesTemp = templates.map(template => {
        return {
            id: template.id,
            template_name: template.template_name,
            type: template['Settemplates.type'] || 'Not updated yet'
        }
    });
    return {
        EM: 'Get template mail success',
        EC: 0,
        DT: templatesTemp
    }
}
const apiSetDefaultTemplateMailService = async (id_template, id_type) => {

    let updateDefault = await db.Settemplate.update({
        id_template: id_template
    }, {
        where: {
            id: id_type
        }
    });
    console.log('check update default: ', updateDefault[0]);
    if (updateDefault[0] === 0) {
        return {
            EM: 'Set default template mail failed',
            EC: 500,
            DT: ''
        }
    }
    return {
        EM: 'Set default template mail success',
        EC: 0,
        DT: ''
    }
}
const apiGetTypesMailService = async () => {
    let types = await db.Settemplate.findAll({
        attributes: ['id', 'type'],
        include: [
            {
                model: db.Template,
                attributes: ['template_name'],
            }
        ],
        raw: true
    });
    if (types.length === 0) {
        return {
            EM: 'There is no type mail',
            EC: -1,
            DT: ''
        }
    }
    let typesData = types.map(type => {
        return {
            id: type.id,
            type: type.type,
            template_Default: type['Template.template_name'] || 'Not updated yet'
        }
    });
    return {
        EM: 'Get type mail success',
        EC: 0,
        DT: typesData
    }
}
const apiSendMailWithTemplateService = async (type, title, id_template) => {
    //type = 'Unpaid', 'Unsolved', 'Unupdated'
    let emails = [];
    let temp;
    switch (type) {
        case 'Unpaid':
            temp = await db.Process.findAll({
                where: {
                    isPaid: false
                },
                attributes: [],
                include: [
                    {
                        model: db.Team,
                        attributes: [],
                        include: [
                            {
                                model: db.User,
                                attributes: ['email'],
                            }
                        ]
                    }
                ],
                raw: true
            });
            break;
        case 'Unupdated':
            temp = await db.Process.findAll({
                where: {
                    isUpdate: false
                },
                attributes: [],
                include: [
                    {
                        model: db.Team,
                        attributes: [],
                        include: [
                            {
                                model: db.User,
                                attributes: ['email'],
                            }
                        ]
                    }
                ],
                raw: true
            });
            break;
        default:
            temp = await db.User.findAll({
                attributes: ['email'],
                where: {
                    role: 'USER'
                },
                raw: true
            });
            break;
    }
    emails = temp.map(item => item['Team.User.email'] ? item['Team.User.email'] : item.email);
    if (emails.length === 0) {
        return {
            EM: 'There is no email to send',
            EC: -1,
            DT: ''
        }
    }

    let htmlContent = '';
    try {
        let template = await db.Template.findOne({
            where: {
                id: id_template
            },
            attributes: ['data'],
            raw: true
        });
        htmlContent = template.data;
    } catch (error) {
        return {
            EM: "Something went wrong with email",
            EC: 500,
            DT: ''
        }
    }
    try {
        await Promise.all(emails.map(async email => {
            await apiSendingEmailService(email, title, htmlContent);
        }));
    }
    catch (error) {
        return {
            EM: "Something went wrong with email",
            EC: 500,
            DT: ''
        }
    }

    return {
        EM: 'Send mail with template success',
        EC: 0,
        DT: emails

    }

}
const apiSendEmailExampleService = async (email, id_template) => {
    let htmlContent = '';
    try {
        let template = await db.Template.findOne({
            where: {
                id: id_template
            },
            attributes: ['data'],
            raw: true
        });
        htmlContent = template.data;
    } catch (error) {
        return {
            EM: "Something went wrong with email",
            EC: 500,
            DT: ''
        }
    }
    try {
        await apiSendingEmailService(email, 'Example Email', htmlContent);
        return {
            EM: 'Send email example success',
            EC: 0,
            DT: ''
        }
    } catch (error) {
        return {
            EM: 'Send email example failed',
            EC: 500,
            DT: ''
        }
    }
}
module.exports = {
    apiLoginService,
    apiRegisterService,
    apiUpdateInfoService,
    apiSendHelpRequestService,
    apiChangePasswordService,
    apiGetAllHelpRequestService,
    apiGetHelpRequestByIdService,
    apiSolveHelpRequestService,
    apiDeleteHelpRequestService,
    apiGetAllUsersService,
    apiGetUserByIdService,
    apiDeleteUserService,
    apiResetPasswordService,
    apiConfirmPaymentService,
    apiSearchByEmailService,
    apiPrepareCSV,
    apiUpdateUserByAdminService,
    apiGetUnpaidTeamsService,
    apiGetUnSolvedRequestsService,
    apiGetHasNotUpdatedInfoService,
    apiForgotPasswordService,
    apiResetPasswordByUserService,
    apiGetDashBoardService,
    apiGetTeamDetailService,
    apiDeleteTeamService,
    apiUpdateTeamStatusService,
    apiGetHelpByUserService,
    apiSaveTemplateMailService,
    apiGetTemplateMailService,
    apiSetDefaultTemplateMailService,
    apiGetTypesMailService,
    apiSendMailWithTemplateService,
    apiSendEmailExampleService,
    apiUploadPaymentProofService
}
