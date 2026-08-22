import { useNavigate } from 'react-router-dom';
import { ShieldX } from 'lucide-react';

const Unauthorized = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center h-full py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mb-4">
        <ShieldX className="text-red-500" size={32} />
      </div>
      <h2 className="text-xl font-display font-bold text-surface-900 mb-2">Access Restricted</h2>
      <p className="text-surface-500 text-sm max-w-xs mb-6">
        You don't have permission to view this page.
      </p>
      <button className="btn-primary" onClick={() => navigate('/main/dashboard')}>
        Back to Dashboard
      </button>
    </div>
  );
};

export default Unauthorized;
