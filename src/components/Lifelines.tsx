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
        className={`
          flex flex-col items-center justify-center w-20 h-20 rounded-full
          transition-all duration-300
          ${fiftyFiftyUsed
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'
            : 'bg-gradient-to-br from-orange-500 to-orange-700 text-white hover:scale-110 hover:shadow-xl hover:shadow-orange-500/50'
          }
        `}
        title="50:50"
      >
        <Divide className="w-8 h-8" />
        <span className="text-xs mt-1">50:50</span>
      </button>

      <button
        onClick={onPhoneFriend}
        disabled={phoneFriendUsed || disabled}
        className={`
          flex flex-col items-center justify-center w-20 h-20 rounded-full
          transition-all duration-300
          ${phoneFriendUsed
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'
            : 'bg-gradient-to-br from-green-500 to-green-700 text-white hover:scale-110 hover:shadow-xl hover:shadow-green-500/50'
          }
        `}
        title="Phone a Friend"
      >
        <Phone className="w-8 h-8" />
        <span className="text-xs mt-1">Phone</span>
      </button>

      <button
        onClick={onAskAudience}
        disabled={askAudienceUsed || disabled}
        className={`
          flex flex-col items-center justify-center w-20 h-20 rounded-full
          transition-all duration-300
          ${askAudienceUsed
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'
            : 'bg-gradient-to-br from-blue-500 to-blue-700 text-white hover:scale-110 hover:shadow-xl hover:shadow-blue-500/50'
          }
        `}
        title="Ask the Audience"
      >
        <Users className="w-8 h-8" />
        <span className="text-xs mt-1">Audience</span>
      </button>
    </div>
  );
}
