import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'AI 求职助手 - 智能求职管理平台',
    template: '%s | AI 求职助手',
  },
  description:
    '基于 AI 的一站式求职管理平台，提供智能简历解析、岗位精准匹配、AI 简历优化、模拟面试训练和投递进度管理功能。',
  keywords: [
    'AI求职',
    '简历优化',
    '岗位匹配',
    '模拟面试',
    '投递管理',
    '求职助手',
    '智能简历',
  ],
  authors: [{ name: 'AI Job Assistant' }],
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    siteName: 'AI 求职助手',
    title: 'AI 求职助手 - 让求职更高效',
    description:
      '基于 AI 的一站式求职管理平台，从简历解析到面试准备，全流程助力你的求职之路。',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI 求职助手 - 让求职更高效',
    description:
      '基于 AI 的一站式求职管理平台，从简历解析到面试准备，全流程助力你的求职之路。',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
