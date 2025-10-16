export const metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <div className="relative flex items-center justify-center h-full w-full overflow-hidden">
      {/* Soft glowing background blob */}
      <div className="absolute w-80 h-80 sm:w-96 sm:h-96 bg-gradient-to-br from-indigo-200/40 via-sky-200/30 to-transparent rounded-full blur-3xl opacity-70 animate-pulse-slow" />

      {/* Glass effect overlay */}
      <div className="absolute inset-0 backdrop-blur-[40px] bg-white/20" />

      {/* Centered logo */}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-4">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-600">
          Welcome!
        </h1>
        <img
          src="/logo.png"
          alt="Company Logo"
          className="w-40 sm:w-48 md:w-56 lg:w-64 xl:w-72 h-auto object-contain drop-shadow-lg transition-transform duration-500 hover:scale-105"
        />
        <p className="text-lg sm:text-xl text-gray-500">Business Solutions</p>
      </div>
    </div>
  );
}
