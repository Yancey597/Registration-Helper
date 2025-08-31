# 🏥 杭州妇幼保健院挂号助手

> 一个基于Tampermonkey的自动化医院挂号脚本，专为杭州市妇幼保健院官方预约系统设计。

⭐ 如果这个项目对你有帮助，请给个Star支持！

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0-green.svg)
![Tampermonkey](https://img.shields.io/badge/Tampermonkey-Required-orange.svg)

## ✨ 特性

- 🎯 **智能筛选** - 支持医生类型（专家号/普通号）和时间偏好（上午/下午）筛选
- ⏰ **定时启动** - 可设置自动启动时间，精确到秒（如13:59:50）
- 🎮 **可视化控制** - 美观的悬浮控制面板，支持拖拽移动
- 📊 **实时监控** - 页面变化实时监控，第一时间捕获预约机会
- 🔄 **自动化流程** - 从日期选择到最终确认的全自动化操作
- 📝 **详细日志** - 完整的操作记录和状态反馈
- 🛡️ **错误处理** - 完善的异常处理和重试机制

## 🚀 快速开始

### 前置要求

1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 浏览器扩展
2. 确保能正常访问杭州市妇幼保健院预约系统

### 安装步骤

1. **下载脚本**
   ```bash
   git clone https://github.com/yourusername/hangzhou-hospital-booking.git
   ```

2. **安装到Tampermonkey**
   - 打开Tampermonkey管理页面
   - 点击"添加新脚本"
   - 复制 `医院挂号助手.js` 的内容
   - 保存并启用脚本

3. **访问预约页面**
   - 打开 [杭州市妇幼保健院预约系统](https://wx.hzwmhp.com:456/hfy_yygh/vue/index.html)
   - 页面右上角会出现挂号助手控制面板

## 📖 使用说明

### 基本配置

| 配置项 | 说明 | 选项 |
|--------|------|------|
| 目标日期 | 要预约的日期 | 格式：MM-DD（如09-14） |
| 医生类型 | 医生资质筛选 | 任意/专家号/普通号 |
| 时间偏好 | 就诊时间段 | 任意/上午/下午 |
| 时段选择 | 具体时段序号 | 第1-11个时段 |
| 点击间隔 | 检测频率 | 毫秒（建议500ms） |
| 自动启动 | 定时启动功能 | 可设置具体时间 |

### 操作流程

1. **设置参数** - 在控制面板中配置目标日期和筛选条件
2. **开始抢号** - 点击"开始抢号"按钮或等待自动启动
3. **监控状态** - 通过日志面板实时查看执行状态
4. **自动完成** - 脚本会自动完成整个预约流程

### 高级功能

- **拖拽面板** - 点击标题栏可拖拽面板到任意位置
- **实时监控** - 页面有新的预约机会时会立即响应
- **智能重试** - 遇到临时错误会自动重试
- **日志导出** - 详细的操作日志便于问题排查

## 🛠️ 技术实现

### 核心技术栈

- **JavaScript ES6+** - 现代JavaScript语法
- **DOM操作** - 原生DOM API进行页面交互
- **MutationObserver** - 监控页面动态变化
- **CSS3** - 现代化的UI样式设计

### 架构设计

```
医院挂号助手
├── 配置管理 (CONFIG)
├── UI组件
│   ├── 控制面板 (createControlPanel)
│   ├── 拖拽功能 (setupDragEvents)
│   └── 日志系统 (log)
├── 核心功能
│   ├── 日期选择 (clickTargetDate)
│   ├── 医生筛选 (checkForAppointmentButton)
│   ├── 时段选择 (selectTimeSlot)
│   └── 预约确认 (confirmAppointment)
├── 自动化控制
│   ├── 主流程 (grabTicket)
│   ├── 页面监控 (monitorPageChanges)
│   └── 定时启动 (checkAutoStart)
└── 工具函数
    ├── 元素等待 (waitForElement)
    ├── 时间段判断 (getTimeSection)
    └── 初始化 (init)
```

## ⚠️ 注意事项

### 使用建议

- **合理设置间隔** - 建议点击间隔不小于500ms，避免给服务器造成压力
- **网络环境** - 确保网络连接稳定，避免因网络问题导致操作失败
- **浏览器兼容** - 推荐使用Chrome、Firefox等现代浏览器
- **及时关注** - 预约成功后请及时到医院就诊

### 免责声明

- 本脚本仅供学习和个人使用
- 请遵守医院相关规定，合理使用预约资源
- 作者不承担因使用本脚本造成的任何后果
- 如有违规使用，责任自负

## 🤝 贡献指南

欢迎提交问题和改进建议！

### 贡献方式

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 开发环境

- Node.js 16+
- 现代浏览器开发者工具
- Tampermonkey 扩展

## 📝 更新日志

### v1.0.0 (2025-09-01)

- ✨ 初始版本发布
- 🎯 支持医生类型和时间偏好筛选
- 🎮 可拖拽的悬浮控制面板
- ⏰ 定时自动启动功能
- 📊 实时页面监控和日志系统
- 🔄 完整的自动化预约流程

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 👨‍💻 作者

**Yanecy_Lu**

- GitHub: [@YourGitHubUsername](https://github.com/YourGitHubUsername)
- Email: your.email@example.com

## 🙏 致谢

- 感谢杭州市妇幼保健院提供的在线预约服务
- 感谢Tampermonkey团队提供的优秀浏览器扩展
- 感谢所有为这个项目提供建议和反馈的用户

---



📞 **预约咨询电话：** 请联系医院官方客服
🌐 **官方网站：** [杭州市妇幼保健院](https://www.hzwmhp.com/)
