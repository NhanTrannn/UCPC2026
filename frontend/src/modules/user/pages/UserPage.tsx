import UserForm from '../../../pages/User/Form/Form';

function UserPage() {
  return (
    <div className="relative min-h-screen w-full overflow-y-auto">
      <div className="absolute inset-0 bg-gradient-to-br from-[#5d2b67] via-[#3f275f] to-[#222445]" />
      <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-600/12 via-violet-700/12 to-black/50" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
        <UserForm />
      </div>
    </div>
  );
}

export default UserPage;
