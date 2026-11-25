import { Phone, Users, Divide } from 'lucide-react';

interface LifelinesProps {
  onFiftyFifty: () => void;
  onPhoneFriend: () => void;
  onAskAudience: () => void;
  fiftyFiftyUsed: boolean;
  phoneFriendUsed: boolean;
  askAudienceUsed: boolean;
  disabled: boolean;
}

export function Lifelines({
  onFiftyFifty,
  onPhoneFriend,
  onAskAudience,
  fiftyFiftyUsed,
  phoneFriendUsed,
  askAudienceUsed,
  disabled
}: LifelinesProps) {
  return (
    <div className="flex justify-center gap-4 mb-8">
      <button
        onClick={onFiftyFifty}
        disabled={fiftyFiftyUsed || disabled}
        className={`flex flex-col items-center justify-center w-20 h-20 rounded-full transition-all duration-300 ${fiftyFiftyUsed ? 'bg-[#edf6e7] text-[#8aa] cursor-not-allowed opacity-50' : 'bg-[#fbd475] text-[#254f55] shadow-[0_4px_0_#e4c56a]'}`}
        title="50:50"
      >
        <Divide className="w-8 h-8" />
        <span className="text-xs mt-1">50:50</span>
      </button>

      <button
        onClick={onPhoneFriend}
        disabled={phoneFriendUsed || disabled}
        className={`flex flex-col items-center justify-center w-20 h-20 rounded-full transition-all duration-300 ${phoneFriendUsed ? 'bg-[#edf6e7] text-[#8aa] cursor-not-allowed opacity-50' : 'bg-[#b53336] text-white shadow-[0_4px_0_#782b35]'}`}
        title="Phone a Friend"
      >
        <Phone className="w-8 h-8" />
        <span className="text-xs mt-1">Phone</span>
      </button>

      <button
        onClick={onAskAudience}
        disabled={askAudienceUsed || disabled}
        className={`flex flex-col items-center justify-center w-20 h-20 rounded-full transition-all duration-300 ${askAudienceUsed ? 'bg-[#edf6e7] text-[#8aa] cursor-not-allowed opacity-50' : 'bg-[#8fd3f0] text-[#254f55] shadow-[0_4px_0_#6eb8d4]'}`}
        title="Ask the Audience"
      >
        <Users className="w-8 h-8" />
        <span className="text-xs mt-1">Audience</span>
      </button>
    </div>
  );
}
