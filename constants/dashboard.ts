import {
  ImageIcon,
  MessageCirclePlus,
  File,
  BoxIcon,
  UserCircle,
  NetworkIcon,
  Folder,
  SendToBack,
} from "lucide-react";

export const sidebarRoutes = [
  {
    label: "New AI Chat",
    icon: MessageCirclePlus,
    href: "/chat",
    color: "text-sky-500",
  },
  {
    label: "Reports Type",
    icon: File,
    href: "/report_type",
    color: "text-violet-500",
  },
  {
    label: "Filing Cabinet",
    icon: Folder,
    href: "/filing_cabinet",
    color: "text-orange-500",
  },
  {
    label: "Department Protocols",
    icon: ImageIcon,
    href: "/department_protocol",
    color: "text-pink-700",
  },
  {
    label: "Accout Settings",
    icon: UserCircle,
    href: "/account_settings",
    color: "text-green-700",
  },
  {
    label: "Refer a friend",
    icon: SendToBack,
    href: "/refer",
    color: "text-pink-400",
  },

];
