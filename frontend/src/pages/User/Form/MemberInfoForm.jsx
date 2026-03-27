import { ErrorMessage, Field, useFormikContext } from 'formik';
import { useEffect, useState } from 'react';
import Universities from './UniversitySelect';

function MemberInfoForm({ isUniversity }) {
  const { values, touched, handleBlur, setFieldValue } = useFormikContext();
  const [universityList, setUniversityList] = useState([]);

  const fieldClassName =
    'mt-2 h-12 w-full rounded-lg border border-[#3b2f63] bg-[#1b1533] px-3 text-base font-semibold text-[#f3efff] outline-none transition placeholder:text-[#7f73ad] focus:border-[#bca4ff] focus:ring-2 focus:ring-[#bca4ff]/30';

  const normalizeVietnameseUppercase = (value) =>
    (value ?? '')
      .toString()
      .normalize('NFC')
      .replace(/\s+/g, ' ')
      .trim()
      .toLocaleUpperCase('vi-VN');

  const handleUppercaseBlur = (fieldName) => (event) => {
    handleBlur(event);
    setFieldValue(fieldName, normalizeVietnameseUppercase(event.target.value));
  };

  useEffect(() => {
    if (isUniversity) {
      fetch('./data/university_names.json')
        .then(res => res.json())
        .then(data => {
          const formatted = (Array.isArray(data) ? data : []).map(name => ({
            label: name,
            value: name,
          }));
          setUniversityList(formatted);
        })

        .catch(err => {
          console.error('Failed to fetch universities:', err);
        });
    }
  }, [isUniversity]);

  return (
    <div className="w-full">
      <h2 className="border-l-2 border-[#d9c2ff] pl-3 text-2xl font-black">Thông tin thành viên</h2>

      <div className="mt-4 space-y-5">
        {values.members.map((_, index) => (
          <div
            key={index}
            className="rounded-xl border border-violet-200/15 bg-[#120d25] p-4 md:p-5"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#f5f2ff]">Thành viên {index + 1}</h3>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#8f86b4]">
                {index + 1}/3
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor={`members[${index}].fullName`} className="text-base font-bold text-[#d6cff5]">
                  Họ và tên <span className="font-normal text-[#8f86b4]">(VD: NGUYỄN VĂN A)</span>
                </label>
                <Field
                  id={`members[${index}].fullName`}
                  name={`members[${index}].fullName`}
                  className={fieldClassName}
                  onBlur={handleUppercaseBlur(`members[${index}].fullName`)}
                />
              {touched.members?.[index]?.fullName && (
                <div className="mt-1">
                  <ErrorMessage name={`members[${index}].fullName`}>
                    {(msg) => <div className="text-sm font-medium text-red-300">{msg}</div>}
                  </ErrorMessage>
                </div>
              )}
              </div>

              <div>
                <label htmlFor={`members[${index}].university`} className="text-base font-bold text-[#d6cff5]">
                  Trường{' '}
                  <span className="font-normal text-[#8f86b4]">
                    (VD: {isUniversity ? 'THPT BÁCH KHOA HÀ NỘI' : 'THPT NGUYỄN CÔNG TRỨ'})
                  </span>
                </label>
                {isUniversity ? (
                  <Universities name={`members[${index}].university`} options={universityList} />
                ) : (
                  <Field
                    id={`members[${index}].university`}
                    name={`members[${index}].university`}
                    className={fieldClassName}
                    onBlur={handleUppercaseBlur(`members[${index}].university`)}
                  />
                )}
                {touched.members?.[index]?.university && (
                  <div className="mt-1">
                    <ErrorMessage name={`members[${index}].university`}>
                      {(msg) => <div className="text-sm font-medium text-red-300">{msg}</div>}
                    </ErrorMessage>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor={`members[${index}].email`} className="text-base font-bold text-[#d6cff5]">
                  Email cá nhân <span className="font-normal text-[#8f86b4]">(VD: abc@gmail.com)</span>
                </label>
                <Field
                  id={`members[${index}].email`}
                  name={`members[${index}].email`}
                  type="email"
                  className={fieldClassName}
                />
              {touched.members?.[index]?.email && (
                <div className="mt-1">
                  <ErrorMessage name={`members[${index}].email`}>
                    {(msg) => <div className="text-sm font-medium text-red-300">{msg}</div>}
                  </ErrorMessage>
                </div>
              )}
              </div>

              <div>
                <label htmlFor={`members[${index}].phone`} className="text-base font-bold text-[#d6cff5]">
                  Số điện thoại <span className="font-normal text-[#8f86b4]">(VD: 0912345678)</span>
                </label>
                <Field
                  id={`members[${index}].phone`}
                  name={`members[${index}].phone`}
                  type="tel"
                  className={fieldClassName}
                />
                {touched.members?.[index]?.phone && (
                  <div className="mt-1">
                    <ErrorMessage name={`members[${index}].phone`}>
                      {(msg) => <div className="text-sm font-medium text-red-300">{msg}</div>}
                    </ErrorMessage>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor={`members[${index}].birth`} className="text-base font-bold text-[#d6cff5]">
                  Ngày sinh <span className="font-normal text-[#8f86b4]">(VD: 22/05/2006)</span>
                </label>
                <Field
                  id={`members[${index}].birth`}
                  name={`members[${index}].birth`}
                  type="date"
                  className={fieldClassName}
                />
                {touched.members?.[index]?.birth && (
                  <div className="mt-1">
                    <ErrorMessage name={`members[${index}].birth`}>
                      {(msg) => <div className="text-sm font-medium text-red-300">{msg}</div>}
                    </ErrorMessage>
                  </div>
                )}
              </div>

              {isUniversity ? (
                <div>
                  <label htmlFor={`members[${index}].studentId`} className="text-base font-bold text-[#d6cff5]">
                    MSSV / Mã học sinh <span className="font-normal text-[#8f86b4]">(VD: 22520123)</span>
                  </label>
                  <Field
                    id={`members[${index}].studentId`}
                    name={`members[${index}].studentId`}
                    className={fieldClassName}
                  />
                  {touched.members?.[index]?.studentId && (
                    <div className="mt-1">
                      <ErrorMessage name={`members[${index}].studentId`}>
                        {(msg) => <div className="text-sm font-medium text-red-300">{msg}</div>}
                      </ErrorMessage>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="text-base font-bold text-transparent">Ẩn trường</label>
                  <div className="mt-2 h-12" />
                </div>
              )}

              <div>
                <label htmlFor={`members[${index}].CCCD`} className="text-base font-bold text-[#d6cff5]">
                  Số CCCD <span className="font-normal text-[#8f86b4]">(VD: 07920500xxxx)</span>
                </label>
                <Field
                  id={`members[${index}].CCCD`}
                  name={`members[${index}].CCCD`}
                  className={fieldClassName}
                />
                {touched.members?.[index]?.CCCD && (
                  <div className="mt-1">
                    <ErrorMessage name={`members[${index}].CCCD`}>
                      {(msg) => <div className="text-sm font-medium text-red-300">{msg}</div>}
                    </ErrorMessage>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MemberInfoForm;
