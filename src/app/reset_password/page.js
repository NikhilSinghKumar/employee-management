import ResetPasswordForm from "../../component/ResetPasswordForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Reset Password",
};

export default function ResetPassword({ searchParams }) {
  const token = searchParams?.token || null;

  return (
    <>
      <ResetPasswordForm token={token} />
    </>
  );
}
