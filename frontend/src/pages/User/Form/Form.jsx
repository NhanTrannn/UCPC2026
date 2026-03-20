import { Form, Formik, useFormikContext } from "formik";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as Yup from "yup";
import { loginSuccess } from "../../../app/redux/auth.slice";
import { useAppDispatch, useAppSelector } from "../../../app/redux/hooks";
import { useRegistrationStore } from "../../../modules/user/store/registration.store";
import MemberInfoForm from "./MemberInfoForm";
import TeamForm from "./TeamForm";

const validationSchema = Yup.object({
  representativeRole: Yup.string()
    .oneOf(["LEADER", "COACH"], "Vai trò đại diện không hợp lệ.")
    .required("Vui lòng chọn vai trò đại diện."),
  teamName: Yup.string()
    .required("Tên đội là bắt buộc.")
    .test("uppercase", "Tên đội phải viết toàn bộ chữ in hoa. Ví dụ: ABC TEAM", (value) => {
      if (!value || !/^[A-Za-zÀ-ỳ0-9\s\-]+$/.test(value)) return true;
      return value === value.toUpperCase();
    }),
  instructorName: Yup.string()
    .required("Họ và tên người hướng dẫn là bắt buộc.")
    .test("uppercase", "Họ tên phải viết toàn bộ chữ in hoa. Ví dụ: NGUYỄN VĂN A", (value) => {
      if (!value || !/^[A-Za-zÀ-ỳ0-9\s\-]+$/.test(value)) return true;
      return value === value.toUpperCase();
    }),
  level: Yup.string()
    .oneOf(["highschool", "university"], "Cấp độ không hợp lệ.") // Chỉ cho phép chọn "Trung học" hoặc "Đại học"
    .required("Phần bắt buộc."),
  instructorEmail: Yup.string()
    .required("Email là bắt buộc.")
    .email("Email không hợp lệ"),
  instructorPhone: Yup.string()
    .matches(/^\d{10}$/, "Số điện thoại cần có 10 số")
    .required("SĐT là bắt buộc."),
}); // Định nghĩa schema cho bước 1

const validationSchema2 = Yup.object({
  members: Yup.array()
    .of(
      Yup.object().shape({
        fullName: Yup.string()
          .required("Họ và tên là bắt buộc.")
          .test("uppercase", "Họ tên phải viết toàn bộ chữ in hoa. Ví dụ: NGUYỄN VĂN A", (value) => {
            if (!value || !/^[A-Za-zÀ-ỳ0-9\s\-]+$/.test(value)) return true;
            return value === value.toUpperCase();
          }),

        email: Yup.string()
          .required("Email là bắt buộc.")
          .email("Email không hợp lệ"),

        phone: Yup.string()
          .matches(/^\d{10}$/, "Số điện thoại cần có 10 số")
          .required("Số điện thoại là bắt buộc."),

        // birth: Yup.date()
        // .matches(/^\d{2}\/\d{2}\/\d{4}$/, "Ngày sinh không hợp lệ. Định dạng: dd/mm/yyyy")
        // .required("Ngày sinh là bắt buộc."),
        // .test("ageMax", "Tuổi phải nhỏ hơn hoặc bằng 24.", (value) => {
        //   if (!value) return false;

        //   const [day, month, year] = value.split("/");
        //   const birthDate = new Date(`${year}-${month}-${day}`);
        //   const today = new Date();

        //   let age = today.getFullYear() - birthDate.getFullYear();
        //   const monthDiff = today.getMonth() - birthDate.getMonth();

        //   // Nếu chưa tới sinh nhật trong năm nay thì giảm 1 tuổi
        //   if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        //     age--;
        //   }

        //   return age <= 24;
        // }),

        birth: Yup.date()
          .required("Ngày sinh là bắt buộc.")
          .test("ageValid", "Ngày tháng năm sinh không hợp lệ.", (value) => {
            if (!value) return false;

            const today = new Date();

            // Không cho ngày sinh trong tương lai
            if (value > today) return false;

            let age = today.getFullYear() - value.getFullYear();
            const monthDiff = today.getMonth() - value.getMonth();

            if (
              monthDiff < 0 ||
              (monthDiff === 0 && today.getDate() < value.getDate())
            ) {
              age--;
            }

            return age >= 1 && age <= 24;
          }),

        university: Yup.string()
          .transform((value) =>
            typeof value === "string"
              ? value.normalize("NFC").replace(/\s+/g, " ").trim()
              : value
          )
          .test("university-valid", "Trường học là bắt buộc.", (value) => {
            return value && value.trim().length > 0;
          })
          .test("uppercase", "Tên trường phải viết toàn bộ chữ in hoa. Ví dụ: THPT BÁCH KHOA HÀ NỘI", (value) => {
            if (!value || !/^[A-Za-zÀ-ỳ0-9\s\-]+$/.test(value)) return true;
            return value === value.toUpperCase();
          })
          .required("Trường học là bắt buộc."),
        CCCD: Yup.string().required("CCCD là bắt buộc."),

      })
    )
    .min(3, "Phải có đúng 3 thành viên")
    .max(3, "Phải có đúng 3 thành viên"),
});
// Validation schema cho trường hợp không là đại học
const validationSchema3 = Yup.object({
  members: Yup.array()
    .of(
      Yup.object().shape({
        fullName: Yup.string()
          .required("Họ và tên là bắt buộc.")
          .test("uppercase", "Họ tên phải viết toàn bộ chữ in hoa. Ví dụ: NGUYỄN VĂN A", (value) => {
            if (!value || !/^[A-Za-zÀ-ỳ0-9\s\-]+$/.test(value)) return true;
            return value === value.toUpperCase();
          }),
        email: Yup.string()
          .required("Email là bắt buộc.")
          .email("Email không hợp lệ"),
        phone: Yup.string()
          .matches(/^\d{10}$/, "Số điện thoại cần có 10 số")
          .required("Số điện thoại là bắt buộc."),
        //   birth: Yup.date()
        //   .matches(/^\d{2}\/\d{2}\/\d{4}$/, "Ngày sinh không hợp lệ. Định dạng: dd/mm/yyyy")
        //   .required("Ngày sinh là bắt buộc."),
        //   .test("ageMax", "Tuổi phải nhỏ hơn hoặc bằng 24.", (value) => {
        //     if (!value) return false;

        //     const [day, month, year] = value.split("/");
        //     const birthDate = new Date(`${year}-${month}-${day}`);
        //     const today = new Date();

        //     let age = today.getFullYear() - birthDate.getFullYear();
        //     const monthDiff = today.getMonth() - birthDate.getMonth();

        //     // Nếu chưa tới sinh nhật trong năm nay thì giảm 1 tuổi
        //     if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        //       age--;
        //     }

        //     return age <= 24;
        //   }),

        birth: Yup.string()
          .required("Ngày sinh là bắt buộc.")
          .test("ageValid", "Ngày tháng năm sinh không hợp lệ.", (value) => {
            if (!value) return false;

            const birthDate = new Date(value); // ISO string => Date
            const today = new Date();

            if (birthDate > today) return false;

            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();

            if (
              monthDiff < 0 ||
              (monthDiff === 0 && today.getDate() < birthDate.getDate())
            ) {
              age--;
            }
            console.log("age:", age);
            return age >= 1 && age <= 24;
          }),

        university: Yup.string()
          .test("uppercase", "Tên trường phải viết toàn bộ chữ in hoa. Ví dụ: THPT NGUYỄN CÔNG TRỨ", (value) => {
            if (!value || !/^[A-Za-zÀ-ỳ0-9\s\-]+$/.test(value)) return true;
            return value === value.toUpperCase();
          })
          .required("Tên trường là bắt buộc."),

        studentId: Yup.string().required("MSSV là bắt buộc."),

        CCCD: Yup.string().required("CCCD là bắt buộc."),
      })
    )
    .min(3, "Phải có ít nhất 3 thành viên")
    .max(3, "Phải có đúng 3 thành viên"),
});
// Validation schema cho trường hợp không là đại học

const validationSchemaPayment = Yup.object({
  paidImage: Yup.string().required("Vui lòng tải lên minh chứng thanh toán."),
});

const PAYMENT_QR_IMAGE =
  import.meta.env.VITE_PAYMENT_QR_IMAGE ||
  "https://img.vietqr.io/image/970436-123456789-compact2.png?amount=300000&addInfo=UCPC%20TEAM%20PAYMENT";

const REGISTRATION_DRAFT_KEY = "ucpc_registration_form_draft_v1";

const createEmptyMember = () => ({
  fullName: "",
  email: "",
  phone: "",
  birth: "",
  university: "",
  studentId: "",
  CCCD: "",
});

const defaultInitialValues = {
  representativeRole: "COACH",
  teamName: "",
  instructorName: "",
  instructorEmail: "",
  instructorPhone: "",
  level: "",
  members: [createEmptyMember(), createEmptyMember(), createEmptyMember()],
  paidImage: "",
};

const loadRegistrationDraft = () => {
  try {
    const rawDraft = localStorage.getItem(REGISTRATION_DRAFT_KEY);
    if (!rawDraft) {
      return {
        values: defaultInitialValues,
        step: 1,
      };
    }

    const parsedDraft = JSON.parse(rawDraft);
    const draftValues = parsedDraft?.values || {};

    const mergedValues = {
      ...defaultInitialValues,
      ...draftValues,
      members: normalizeMembers(draftValues.members),
    };

    const draftStep = Number(parsedDraft?.step);

    return {
      values: mergedValues,
      step: [1, 2, 3].includes(draftStep) ? draftStep : 1,
    };
  } catch (error) {
    return {
      values: defaultInitialValues,
      step: 1,
    };
  }
};

const normalizeMembers = (members) => {
  if (!Array.isArray(members) || members.length === 0) {
    return [createEmptyMember(), createEmptyMember(), createEmptyMember()];
  }

  return [0, 1, 2].map((index) => ({
    ...createEmptyMember(),
    ...(members[index] || {}),
  }));
};

function RegistrationDraftAutoSave({ step }) {
  const { values, isSubmitting } = useFormikContext();

  useEffect(() => {
    if (isSubmitting) {
      return;
    }

    try {
      localStorage.setItem(
        REGISTRATION_DRAFT_KEY,
        JSON.stringify({
          step,
          values,
          updatedAt: Date.now(),
        })
      );
    } catch (error) {
      // Ignore localStorage errors (quota/private mode).
    }
  }, [step, values, isSubmitting]);

  return null;
}

var values_tmp = null;
function  UserForm() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const authUser = useAppSelector((state) => state.auth.user);
  const {
    submitTeam,
    submitError,
    submitSuccess,
    clearSubmitError,
    clearSubmitSuccess,
  } = useRegistrationStore();

  const waitTwoSeconds = async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  };
  const [draftState] = useState(() => loadRegistrationDraft());
  const [step, setStep] = useState(draftState.step);
  const [initialValues] = useState(draftState.values);

  const handleGoHome = () => {
    clearSubmitSuccess();
    navigate("/");
  };

  const handleCloseSuccessPopup = () => {
    clearSubmitSuccess();
  };

  values_tmp = initialValues;

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={
        step === 1
          ? validationSchema
          : step === 2
          ? values_tmp.level === "highschool"
            ? validationSchema2
            : validationSchema3
          : validationSchemaPayment
      }
      onSubmit={async (values, { setSubmitting, setTouched }) => {
        if (step === 1) {
          console.log("Step 1:", values);
          values_tmp = values;
          await waitTwoSeconds();
          setTouched({});
          clearSubmitError();
          clearSubmitSuccess();
          setStep(2);
          setSubmitting(false);
        } else if (step === 2) {
          console.log("Step 2:", values_tmp, values);
          values_tmp = values;
          await waitTwoSeconds();
          setTouched({});
          clearSubmitError();
          clearSubmitSuccess();
          setStep(3);
          setSubmitting(false);
        } else {
          console.log("Step 3:", values_tmp, values);
          values_tmp = values;
          try {
            clearSubmitError();
            clearSubmitSuccess();
            await submitTeam(values);
            if (authUser) {
              dispatch(
                loginSuccess({
                  ...authUser,
                  hasTeam: true,
                  teamName: values.teamName || authUser.teamName,
                })
              );
            }
            localStorage.removeItem(REGISTRATION_DRAFT_KEY);
          } finally {
            setSubmitting(false);
          }
        }
      }}
      validateOnBlur={true}
      validateOnChange={true}
    >
      {({ isSubmitting, values, setFieldValue, errors, touched }) => {
        const progress = step === 1 ? 33 : step === 2 ? 66 : 100;

        return (
          <Form className="registration-shell font-bevietnam mx-auto my-10 w-full max-w-6xl rounded-2xl border border-violet-300/20 bg-[#0f0b1f]/88 px-4 py-6 text-[#f5f2ff] shadow-[0_28px_70px_rgba(5,2,18,0.65)] backdrop-blur-md md:px-8">
            <RegistrationDraftAutoSave step={step} />
            <div className="mb-6 border-b border-violet-200/15 pb-5">
              <h1 className="text-3xl font-extrabold tracking-wide md:text-4xl">Đăng ký tham gia</h1>
              <p className="mt-2 text-sm text-[#b6afd6]">Bước {step}: Cung cấp thông tin đội thi và hoàn tất thanh toán</p>

              <div className="mt-4 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#8f86b4]">
                <span>Tiến độ: Thông tin chung</span>
                <span>{progress}%</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#241a46]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#b388ff] to-[#d9c2ff] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="mt-4 flex gap-6 border-b border-violet-200/10 pb-2 text-xs font-semibold uppercase tracking-wider">
                <span className={step === 1 ? 'text-[#efe8ff]' : 'text-[#6d6690]'}>Thông tin chung</span>
                <span className={step === 2 ? 'text-[#efe8ff]' : 'text-[#6d6690]'}>Thông tin thành viên</span>
                <span className={step === 3 ? 'text-[#efe8ff]' : 'text-[#6d6690]'}>Thanh toán</span>
              </div>
            </div>

            {step === 1 ? <TeamForm /> : null}
            {step === 2 ? <MemberInfoForm isUniversity={values.level === "university"} /> : null}
            {step === 3 ? (
              <div className="space-y-6 rounded-xl border border-violet-200/15 bg-[#1a1334]/60 p-4 md:p-6">
                <div>
                  <h3 className="text-lg font-bold text-[#efe8ff]">Thanh toán lệ phí</h3>
                  <p className="mt-1 text-sm text-[#b6afd6]">
                    Quét mã QR bên dưới để chuyển khoản, sau đó tải lên ảnh chụp minh chứng giao dịch.
                  </p>
                </div>

                <div className="grid gap-6 md:grid-cols-[260px_1fr]">
                  <div className="rounded-xl border border-violet-200/20 bg-[#110d24]/70 p-4 text-center">
                    <img
                      src={PAYMENT_QR_IMAGE}
                      alt="QR thanh toán UCPC"
                      className="mx-auto h-56 w-56 rounded-lg border border-violet-200/20 bg-white object-contain"
                    />
                    <p className="mt-3 text-xs text-[#b6afd6]">Mã QR thanh toán</p>
                  </div>

                  <div className="space-y-3">
                    <label htmlFor="paidImage" className="block text-sm font-semibold text-[#efe8ff]">
                      Minh chứng thanh toán (bắt buộc)
                    </label>
                    <input
                      id="paidImage"
                      type="file"
                      accept="image/*"
                      onChange={(event) => {
                        const file = event.currentTarget.files?.[0];
                        if (!file) {
                          void setFieldValue("paidImage", "");
                          return;
                        }

                        const reader = new FileReader();
                        reader.onloadend = () => {
                          if (typeof reader.result === "string") {
                            void setFieldValue("paidImage", reader.result);
                          }
                        };
                        reader.readAsDataURL(file);
                      }}
                      className="w-full rounded-lg border border-violet-200/25 bg-[#130f28] px-3 py-2 text-sm text-[#efe8ff] file:mr-3 file:rounded-md file:border-0 file:bg-[#d9c2ff] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[#1f1538]"
                    />

                    {touched.paidImage && errors.paidImage ? (
                      <p className="text-sm font-medium text-red-300">{errors.paidImage}</p>
                    ) : null}

                    {values.paidImage ? (
                      <div className="rounded-lg border border-violet-200/20 bg-[#110d24]/70 p-3">
                        <p className="mb-2 text-xs text-[#b6afd6]">Xem trước minh chứng:</p>
                        <img
                          src={values.paidImage}
                          alt="Minh chứng thanh toán"
                          className="max-h-72 w-full rounded-lg border border-violet-200/20 object-contain"
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-8 flex flex-col items-end gap-3 border-t border-violet-200/10 pt-5">
              <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                {step > 1 && (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => {
                      clearSubmitError();
                      clearSubmitSuccess();
                      setStep(step - 1);
                    }}
                    className={`min-w-44 rounded-lg border border-[#cdb8ff]/60 bg-[#2d2351] px-8 py-3 text-sm font-bold uppercase tracking-[0.2em] text-[#f3e9ff] transition hover:bg-[#3a2f64] sm:mr-auto ${isSubmitting ? "cursor-not-allowed opacity-70" : ""}`}
                  >
                    Quay lại
                  </button>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`min-w-44 rounded-lg border border-violet-200/20 bg-[#d9c2ff] px-8 py-3 text-sm font-bold uppercase tracking-[0.2em] text-[#22163e] transition hover:bg-[#e7d6ff] ${isSubmitting ? "cursor-not-allowed opacity-70" : ""}`}
                >
                  {isSubmitting
                    ? step === 3
                      ? "Đang đăng ký..."
                      : "Đang xử lý..."
                    : step === 3
                    ? "Đăng ký"
                    : "Tiếp tục"}
                </button>
              </div>

              {submitError && <p className="text-sm font-medium text-red-300">{submitError}</p>}
              {submitSuccess && <p className="text-sm font-medium text-emerald-300">{submitSuccess}</p>}
            </div>

            {submitSuccess ? (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
                <div className="w-full max-w-md rounded-2xl border border-emerald-300/35 bg-[#140f2a] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
                  <h3 className="text-xl font-bold text-emerald-200">Đăng ký thành công</h3>
                  <p className="mt-2 text-sm text-[#c9c2e8]">{submitSuccess}</p>

                  <div className="mt-5 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleCloseSuccessPopup}
                      className="rounded-lg border border-violet-200/20 bg-[#2d2351] px-4 py-2 text-sm font-semibold text-[#f3e9ff] transition hover:bg-[#3a2f64]"
                    >
                      Ở lại trang
                    </button>
                    <button
                      type="button"
                      onClick={handleGoHome}
                      className="rounded-lg border border-emerald-200/30 bg-emerald-300/85 px-4 py-2 text-sm font-bold text-[#1a1232] transition hover:bg-emerald-200"
                    >
                      Về trang chủ
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </Form>
        );
      }}
    </Formik>
  );
}

export default UserForm;
