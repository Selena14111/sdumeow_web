import type { ThemeConfig } from 'antd'

export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: '#f4cc45',
    colorInfo: '#f4cc45',
    colorBgLayout: '#f8f6f4',
    borderRadius: 12,
    fontFamily: "Poppins, Inter, 'PingFang SC', 'Microsoft Yahei', sans-serif",
  },
  components: {
    Button: {
      controlHeight: 46,
      borderRadius: 999,
      fontWeight: 600,
    },
    Card: {
      borderRadiusLG: 20,
    },
    Input: {
      borderRadius: 12,
      controlHeightLG: 46,
    },
  },
}
