import { IconType } from 'react-icons';
import {
  LuInstagram,
  LuTwitter,
  LuFacebook,
  LuLinkedin,
  LuGithub,
  LuYoutube,
  LuMail,
  LuGlobe,
  LuMessageCircle,
  LuPhone,
} from 'react-icons/lu';
import {
  FaTiktok,
  FaSpotify,
  FaTwitch,
  FaDiscord,
  FaTelegram,
  FaWhatsapp,
  FaSnapchat,
  FaPinterest,
  FaMedium,
  FaReddit,
  FaBehance,
  FaDribbble,
} from 'react-icons/fa6';

export interface SocialPlatform {
  name: string;
  icon: IconType;
  color: string;
}

const SOCIAL_PLATFORMS: Record<string, SocialPlatform> = {
  instagram: {
    name: 'Instagram',
    icon: LuInstagram,
    color: '#E4405F',
  },
  twitter: {
    name: 'Twitter',
    icon: LuTwitter,
    color: '#1DA1F2',
  },
  'x.com': {
    name: 'X',
    icon: LuTwitter,
    color: '#000000',
  },
  facebook: {
    name: 'Facebook',
    icon: LuFacebook,
    color: '#1877F2',
  },
  linkedin: {
    name: 'LinkedIn',
    icon: LuLinkedin,
    color: '#0A66C2',
  },
  github: {
    name: 'GitHub',
    icon: LuGithub,
    color: '#181717',
  },
  youtube: {
    name: 'YouTube',
    icon: LuYoutube,
    color: '#FF0000',
  },
  tiktok: {
    name: 'TikTok',
    icon: FaTiktok,
    color: '#000000',
  },
  spotify: {
    name: 'Spotify',
    icon: FaSpotify,
    color: '#1DB954',
  },
  twitch: {
    name: 'Twitch',
    icon: FaTwitch,
    color: '#9146FF',
  },
  discord: {
    name: 'Discord',
    icon: FaDiscord,
    color: '#5865F2',
  },
  telegram: {
    name: 'Telegram',
    icon: FaTelegram,
    color: '#26A5E4',
  },
  whatsapp: {
    name: 'WhatsApp',
    icon: FaWhatsapp,
    color: '#25D366',
  },
  snapchat: {
    name: 'Snapchat',
    icon: FaSnapchat,
    color: '#FFFC00',
  },
  pinterest: {
    name: 'Pinterest',
    icon: FaPinterest,
    color: '#E60023',
  },
  medium: {
    name: 'Medium',
    icon: FaMedium,
    color: '#000000',
  },
  reddit: {
    name: 'Reddit',
    icon: FaReddit,
    color: '#FF4500',
  },
  behance: {
    name: 'Behance',
    icon: FaBehance,
    color: '#1769FF',
  },
  dribbble: {
    name: 'Dribbble',
    icon: FaDribbble,
    color: '#EA4C89',
  },
};

/**
 * Detects the social platform from a URL
 * @param url - The URL to analyze
 * @returns SocialPlatform object or null if not a recognized platform
 */
export function detectSocialPlatform(url: string): SocialPlatform | null {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase().replace(/^www\./, '');

    // Check for email
    if (url.startsWith('mailto:')) {
      return {
        name: 'Email',
        icon: LuMail,
        color: '#EA4335',
      };
    }

    // Check for phone
    if (url.startsWith('tel:')) {
      return {
        name: 'Phone',
        icon: LuPhone,
        color: '#34A853',
      };
    }

    // Check for SMS
    if (url.startsWith('sms:')) {
      return {
        name: 'SMS',
        icon: LuMessageCircle,
        color: '#4285F4',
      };
    }

    // Match against known platforms
    for (const [key, platform] of Object.entries(SOCIAL_PLATFORMS)) {
      if (hostname.includes(key)) {
        return platform;
      }
    }

    // Generic website fallback
    return {
      name: 'Website',
      icon: LuGlobe,
      color: '#6B7280',
    };
  } catch {
    // Invalid URL, return generic
    return {
      name: 'Link',
      icon: LuGlobe,
      color: '#6B7280',
    };
  }
}

/**
 * Get icon element for a URL
 * @param url - The URL to get icon for
 * @param className - Optional className for the icon
 * @returns Icon JSX element
 */
export function getSocialIcon(
  url: string,
  className?: string,
): React.ReactElement {
  const platform = detectSocialPlatform(url);
  const Icon = platform?.icon || LuGlobe;
  return <Icon className={className} />;
}

/**
 * Get platform name for a URL
 * @param url - The URL to get platform name for
 * @returns Platform name
 */
export function getSocialPlatformName(url: string): string {
  const platform = detectSocialPlatform(url);
  return platform?.name || 'Link';
}
