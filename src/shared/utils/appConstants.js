import {
  faBottleWater,
  faChartLine,
  faCogs,
  faFileUpload,
  faHouse,
  faMicrochip,
} from "@fortawesome/free-solid-svg-icons";

export const perPage = 10;

export const Dairy = [
  { title: "dashboard", icon: faHouse, tooltip: "Dashboard" },
  { title: "device", icon: faMicrochip, tooltip: "Devices" },
  { title: "settings", icon: faCogs, tooltip: "Settings" },
  { title: "records", icon: faChartLine, tooltip: "Reports" },
  { title: "uploads", icon: faFileUpload, tooltip: "Upload Files" },
];

export const Device = [
  { title: "dashboard", icon: faHouse, tooltip: "Dashboard" },
  { title: "settings", icon: faCogs, tooltip: "Device Settings" },
  { title: "records", icon: faChartLine, tooltip: "View Reports" },
  { title: "uploads", icon: faFileUpload, tooltip: "Upload Files" },
];
