# TypeScript 用户脚本模板

这是一个用于快速开发用户脚本（UserScript）的 TypeScript 模板项目。

## 功能特性

- 使用 TypeScript 实现：
  * 更好的代码提示和自动补全
  * 更易维护的代码结构
  * 类型安全：在编译时捕获类型错误
- 使用 esbuild 进行高效构建
- 集成 GitHub Actions 自动化工作流：
  * 预览版本：dev分支push时自动构建并发布预览版
  * 正式版本：master分支push时自动构建并发布正式版
- 包含基本的 CSS 样式文件，自动注入到最终输出
- 提供用户脚本元数据模板，自动生成版本信息
- 支持生成压缩和未压缩两个版本

## 使用方法

1. 克隆本仓库
   
2. 安装依赖：
   ```bash
   npm install
   ```

3. 开发脚本：
   - 主入口文件：`src/main.ts`
   - 样式文件：`src/css/main.css`
   - 类型定义：`src/css/main.d.ts`
  
4. 构建脚本：
   ```bash
   npm run build [tag]
   ```
   可选参数：
   - dev: 开发模式，生成带dev后缀的版本号
   - preview: 预览模式，生成预览版本
   - latest: 正式模式，生成正式版本

5. 推送更新
   ```bash
   npm run release
   ```

6. 发布流程：
   - 开发阶段：在dev分支进行开发，push代码会自动发布预览版
   - 发布阶段：合并到master分支会自动发布正式版

## 注意事项

1. 修改 `src/mata/userjs.mata` 文件中的元数据信息
2. 在 `src/main.ts` 中编写核心逻辑
3. 如果需要自定义样式，请修改 `src/css/main.css`，样式会自动注入到最终输出
4. 分支管理：
   - dev分支：用于日常开发，push会自动发布预览版
   - master分支：用于正式发布，push会自动发布正式版
5. 发布新版本时会自动更新版本号并生成发布包
6. 确保在提交代码前运行 `npm run build` 以验证构建, 建议在此步骤进行浏览器环境测试。
