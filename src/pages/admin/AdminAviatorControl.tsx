import AdminLayout from "@/components/admin/AdminLayout";

const AdminAviatorControl = () => {
  return (
    <AdminLayout>
      <div className="p-4">
        <h1 className="text-3xl font-bold text-white mb-4">Aviator Control Panel</h1>
        <p className="text-slate-300">This is a test - if you see this, the page is working!</p>
        <div className="mt-4 p-4 bg-slate-800 rounded-lg">
          <p className="text-green-400">✅ Component loaded successfully</p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAviatorControl;
