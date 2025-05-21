import { useNavigate } from 'react-router-dom';
import { useWallet } from '../../hooks/useWallet';
import { Menu, User, LogOut, Settings } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header = ({ toggleSidebar }: HeaderProps) => {
  const { address, balance, disconnect } = useWallet();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected';

  const handleDisconnect = () => {
    disconnect();
    navigate('/');
  };

  const handleProfileClick = () => {
    setDropdownOpen(false);
    navigate('/profile');
  };

  return (
    <header className="bg-input border-b border-border h-16 flex items-center justify-between px-4 z-10">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md hover:bg-muted/30 text-muted-foreground"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-xl font-semibold tracking-tight text-primary">MumbleChat</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground">
          <span>Network: Ramestta Mainnet</span>
          <div className="h-4 w-0.5 bg-border"></div>
          <span>{balance} RAM</span>
        </div>

        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-background hover:bg-muted/30 transition-colors"
          >
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <User size={16} />
            </div>
            <span className="text-sm hidden md:inline-block">{shortAddress}</span>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-md bg-input border border-border shadow-lg py-1 z-20">
              <button
                onClick={handleProfileClick}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-muted/30"
              >
                <User size={16} />
                Profile
              </button>
              <button
                onClick={handleDisconnect}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-muted/30 text-error"
              >
                <LogOut size={16} />
                Disconnect
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;