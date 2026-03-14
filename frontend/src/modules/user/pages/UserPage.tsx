import UserForm from '../../../pages/User/Form/Form';

const mountain = '/photos/mountain.png';

function UserPage() {
  return (
    <div
      style={{ backgroundImage: `url(${mountain})` }}
      className="absolute h-screen bg-[length:101%] bg-no-repeat w-full overflow-hidden flex items-center justify-center bg-[position:0_-100px]"
    >
      <div className="relative z-20">
        <UserForm />
      </div>
    </div>
  );
}

export default UserPage;
