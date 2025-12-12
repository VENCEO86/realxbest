import { formatNumber } from "@/lib/utils";
import Image from "next/image";

interface Channel {
  id: string;
  channelId?: string;
  channelName: string;
  handle: string | null;
  profileImageUrl: string | null;
  subscriberCount: number;
  totalViewCount: number;
  videoCount: number;
  category: { name: string } | null;
  channelCreatedAt: Date | null;
  description: string | null;
}

export function ChannelHeader({ channel }: { channel: Channel }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex flex-col md:flex-row gap-6">
        {channel.profileImageUrl && (
          <div className="flex-shrink-0">
            <Image
              src={channel.profileImageUrl}
              alt={channel.channelName}
              width={120}
              height={120}
              className="rounded-full"
            />
          </div>
        )}
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2">{channel.channelName}</h1>
          {(channel.handle || channel.channelId || channel.id) && (
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              <a
                href={channel.handle 
                  ? `https://www.youtube.com/@${channel.handle}`
                  : `https://www.youtube.com/channel/${channel.channelId || channel.id}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {channel.handle ? `@${channel.handle}` : "YouTube 채널 보기"}
              </a>
            </p>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">구독자</div>
              <div className="text-xl font-bold">{formatNumber(channel.subscriberCount)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">총 조회수</div>
              <div className="text-xl font-bold">{formatNumber(channel.totalViewCount)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">동영상</div>
              <div className="text-xl font-bold">{channel.videoCount.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">카테고리</div>
              <div className="text-xl font-bold">{channel.category?.name || "기타"}</div>
            </div>
          </div>
          {channel.description && (
            <p className="mt-4 text-gray-700 dark:text-gray-300">{channel.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

