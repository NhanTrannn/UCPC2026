'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */
    await queryInterface.bulkInsert('Requests', [
      {
        teamId: 6,
        userId: 1,
        title: 'Hỗ trợ thanh toán',
        data: 'Tôi gặp vấn đề khi thanh toán, vui lòng hỗ trợ',
        content: 'Payment issue - tìm hiểu thêm về quy trình thanh toán',
        isSolve: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        teamId: 6,
        userId: 1,
        title: 'Cập nhật thông tin đội',
        data: 'Cần hỗ trợ cập nhật thông tin đội thi',
        content: 'Team info update - muốn thay đổi thành viên của đội',
        isSolve: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        teamId: 6,
        userId: 1,
        title: 'Quên mật khẩu',
        data: 'Tôi quên mật khẩu và không thể tạo yêu cầu đặt lại',
        content: 'Password reset - đã gửi email nhưng chưa nhận được',
        isSolve: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete('Requests', null, {});
  }
};
