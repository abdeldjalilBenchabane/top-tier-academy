import React from 'react';

const StudentTable = ({ students }) => {
  return (
    <div className="bg-card rounded-lg shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="dashboard-table w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                الرقم
              </th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                اسم الطالب
              </th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                الصف
              </th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                المعدل
              </th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                الحالة
              </th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                تاريخ التسجيل
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students.map((student, index) => (
              <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {index + 1}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <img 
                        className="h-10 w-10 rounded-full object-cover" 
                        src={student.avatar || '/images/default-avatar.png'} 
                        alt={student.name}
                      />
                    </div>
                    <div className="mr-4">
                      <div className="text-sm font-medium text-gray-900">
                        {student.name}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {student.grade}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {student.average}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    student.status === 'نشط' ?'bg-green-100 text-green-800' 
                      : student.status === 'معلق' ?'bg-yellow-100 text-yellow-800' :'bg-red-100 text-red-800'
                  }`}>
                    {student.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {student.registrationDate}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentTable;