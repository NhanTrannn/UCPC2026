import { ErrorMessage, Field, useFormikContext } from 'formik';
import { useEffect, useState } from 'react';
import Universities from './UniversitySelect';

function TeamForm() {
  const { values, setFieldValue, handleBlur } = useFormikContext();
  const [universityList, setUniversityList] = useState([]);
  const fieldClassName =
    'mt-2 h-12 w-full rounded-lg border border-[#3b2f63] bg-[#1b1533] px-3 text-base font-semibold text-[#f3efff] outline-none transition placeholder:text-[#7f73ad] focus:border-[#bca4ff] focus:ring-2 focus:ring-[#bca4ff]/30 font-sans';

  useEffect(() => {
    if (values.level !== 'university') {
      return;
    }

    fetch('./data/university_names.json')
      .then((res) => res.json())
      .then((data) => {
        const formatted = (Array.isArray(data) ? data : []).map((name) => ({
          label: name,
          value: name,
        }));
        setUniversityList(formatted);
      })
      .catch((err) => {
        console.error('Failed to fetch universities:', err);
      });
  }, [values.level]);

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

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-violet-200/15 bg-[#120d25] p-4 md:p-5">
        <h2 className="border-l-2 border-[#d9c2ff] pl-3 text-xl font-bold">Đối tượng tham gia</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <button
            type="button"
            onClick={() => setFieldValue('level', 'university')}
            className={`rounded-lg border p-4 text-left transition ${values.level === 'university'
              ? 'border-[#d9c2ff] bg-[#2b214d] shadow-[0_0_0_1px_rgba(217,194,255,0.2)]'
              : 'border-[#3a2d60] bg-[#16102b] hover:border-[#8772c9]'
              }`}
          >
            <p className="text-sm font-bold">Sinh viên (Đại học)</p>
            <p className="mt-1 text-xs text-[#988dbf]">Dành cho sinh viên thuộc trường Đại học, Cao đẳng</p>
          </button>

          <button
            type="button"
            onClick={() => setFieldValue('level', 'highschool')}
            className={`rounded-lg border p-4 text-left transition ${values.level === 'highschool'
              ? 'border-[#d9c2ff] bg-[#2b214d] shadow-[0_0_0_1px_rgba(217,194,255,0.2)]'
              : 'border-[#3a2d60] bg-[#16102b] hover:border-[#8772c9]'
              }`}
          >
            <p className="text-sm font-bold">Học sinh (THPT)</p>
            <p className="mt-1 text-xs text-[#988dbf]">Dành cho học sinh các trường Trung học Phổ thông</p>
          </button>
        </div>
        <ErrorMessage name={'level'}>
          {(msg) => <div className="mt-2 text-sm font-medium text-red-300">{msg}</div>}
        </ErrorMessage>
      </section>

      <section className="rounded-xl border border-violet-200/15 bg-[#120d25] p-4 md:p-5">
        <h2 className="border-l-2 border-[#d9c2ff] pl-3 text-xl font-bold">Thông tin chung</h2>

        <div className="mt-4">
          <p className="text-base font-bold text-[#d6cff5]">Vai trò người đại diện</p>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setFieldValue('representativeRole', 'LEADER')}
              className={`rounded-lg border p-3 text-left text-sm font-semibold transition ${values.representativeRole === 'LEADER'
                ? 'border-[#d9c2ff] bg-[#2b214d] text-[#f3efff] shadow-[0_0_0_1px_rgba(217,194,255,0.2)]'
                : 'border-[#3a2d60] bg-[#16102b] text-[#bfb5df] hover:border-[#8772c9]'
                }`}
            >
              Nhóm trưởng
            </button>

            <button
              type="button"
              onClick={() => setFieldValue('representativeRole', 'COACH')}
              className={`rounded-lg border p-3 text-left text-sm font-semibold transition ${values.representativeRole === 'COACH'
                ? 'border-[#d9c2ff] bg-[#2b214d] text-[#f3efff] shadow-[0_0_0_1px_rgba(217,194,255,0.2)]'
                : 'border-[#3a2d60] bg-[#16102b] text-[#bfb5df] hover:border-[#8772c9]'
                }`}
            >
              Huấn luyện viên
            </button>
          </div>
          <ErrorMessage name={'representativeRole'}>
            {(msg) => <div className="mt-1 text-sm font-medium text-red-300">{msg}</div>}
          </ErrorMessage>
        </div>

        <div className="mt-4">
          <label htmlFor="teamName" className="text-base font-bold text-[#d6cff5]">
            Tên đội thi <span className="font-normal text-[#8f86b4]">(VD: ABC TEAM)</span>
          </label>
          <Field
            id="teamName"
            name="teamName"
            className={fieldClassName}
            onBlur={handleUppercaseBlur('teamName')}
          />
          <ErrorMessage name={'teamName'}>
            {(msg) => <div className="mt-1 text-sm font-medium text-red-300">{msg}</div>}
          </ErrorMessage>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="instructorName" className="text-base font-bold text-[#d6cff5]">
              {values.representativeRole === 'LEADER' ? 'Họ và tên nhóm trưởng' : 'Họ và tên HLV'}{' '}
              <span className="font-normal text-[#8f86b4]">(VD: NGUYỄN VĂN A)</span>
            </label>
            <Field
              id="instructorName"
              name="instructorName"
              className={fieldClassName}
              onBlur={handleUppercaseBlur('instructorName')}
            />
            <ErrorMessage name={'instructorName'}>
              {(msg) => <div className="mt-1 text-sm font-medium text-red-300">{msg}</div>}
            </ErrorMessage>
          </div>

          <div>
            <label htmlFor="instructorPhone" className="text-base font-bold text-[#d6cff5]">
              {values.representativeRole === 'LEADER' ? 'Số điện thoại nhóm trưởng' : 'Số điện thoại HLV'}{' '}
              <span className="font-normal text-[#8f86b4]">(VD: 0912345678)</span>
            </label>
            <Field id="instructorPhone" name="instructorPhone" className={fieldClassName} />
            <ErrorMessage name={'instructorPhone'}>
              {(msg) => <div className="mt-1 text-sm font-medium text-red-300">{msg}</div>}
            </ErrorMessage>
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="instructorEmail" className="text-base font-bold text-[#d6cff5]">
            Email người đại diện <span className="font-normal text-[#8f86b4]">(VD: abc@gmail.com)</span>
          </label>
          <Field id="instructorEmail" name="instructorEmail" className={fieldClassName} />
          <ErrorMessage name={'instructorEmail'}>
            {(msg) => <div className="mt-1 text-sm font-medium text-red-300">{msg}</div>}
          </ErrorMessage>
        </div>

        <div className="mt-4">
          <label htmlFor="instructorSchoolName" className="text-base font-bold text-[#d6cff5]">
            Trường học người đại diện{' '}
            <span className="font-normal text-[#8f86b4]">
              (VD: {values.level === 'university' ? 'ĐẠI HỌC BÁCH KHOA HÀ NỘI' : 'THPT NGUYỄN CÔNG TRỨ'})
            </span>
          </label>
          {values.level === 'university' ? (
            <Universities name="instructorSchoolName" options={universityList} />
          ) : (
            <>
              <Field
                id="instructorSchoolName"
                name="instructorSchoolName"
                className={fieldClassName}
                onBlur={handleUppercaseBlur('instructorSchoolName')}
              />
              <ErrorMessage name={'instructorSchoolName'}>
                {(msg) => <div className="mt-1 text-sm font-medium text-red-300">{msg}</div>}
              </ErrorMessage>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export default TeamForm;
