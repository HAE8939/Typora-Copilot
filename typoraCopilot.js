// plugin/custom/plugins/typoraCopilot.js

class typoraCopilot extends BaseCustomPlugin {
    
    style = () => `
        #typora-copilot-panel {
            position: fixed; right: 20px; bottom: 20px; width: 340px; height: 550px;
            background: var(--bg-color); border: 1px solid var(--item-hover-bg-color);
            box-shadow: 0 4px 12px rgba(0,0,0,0.2); z-index: 9999;
            display: none; flex-direction: column; border-radius: 8px;
            font-family: var(--font-family); font-size: 14px;
        }
        /* 标题栏布局调整 */
        #copilot-header {
            padding: 10px 15px; border-bottom: 1px solid var(--item-hover-bg-color);
            display: flex; justify-content: space-between; align-items: center; 
            background: var(--side-bar-bg-color); border-radius: 8px 8px 0 0;
            user-select: none; gap: 10px;
        }
        
        /* 下拉选择框样式 */
        #model-select {
            flex: 1; max-width: 160px;
            padding: 2px 5px; border-radius: 4px; border: 1px solid var(--item-hover-bg-color);
            background: var(--main-bg-color); color: var(--text-color);
            font-size: 12px; outline: none; cursor: pointer;
        }

        #copilot-toolbar {
            padding: 5px 10px; border-bottom: 1px solid var(--item-hover-bg-color);
            display: flex; gap: 10px; background: var(--main-bg-color); align-items: center; font-size: 12px;
        }
        .toolbar-btn {
            cursor: pointer; padding: 2px 6px; border-radius: 4px; border: 1px solid transparent;
            display: flex; align-items: center; gap: 4px; opacity: 0.7;
        }
        .toolbar-btn:hover { background: var(--item-hover-bg-color); opacity: 1; }
        .toolbar-btn.active { background: #e6f7ff; color: #1890ff; border-color: #91d5ff; opacity: 1; }
        
        #copilot-messages { flex: 1; overflow-y: auto; padding: 10px; scroll-behavior: smooth; position: relative;}
        
        /* 消息气泡 */
        .msg-row { display: flex; flex-direction: column; margin-bottom: 15px; }
        .msg-role { font-size: 12px; opacity: 0.6; margin-bottom: 2px; }
        .msg-content { 
            padding: 8px 12px; border-radius: 6px; line-height: 1.5; word-wrap: break-word; 
            max-width: 90%; position: relative;
        }
        .msg-user { align-items: flex-end; }
        .msg-user .msg-content { background: #e6f7ff; color: #000; border: 1px solid #91d5ff; border-top-right-radius: 0; }
        .msg-ai { align-items: flex-start; }
        .msg-ai .msg-content { background: var(--item-hover-bg-color); border: 1px solid var(--item-hover-bg-color); border-top-left-radius: 0; }
        
        /* 按钮组 */
        .action-bar { display: flex; gap: 8px; margin-top: 6px; }
        .action-btn {
            font-size: 11px; cursor: pointer; padding: 2px 6px; border-radius: 4px; opacity: 0.8;
            display: flex; align-items: center; gap: 4px; border: 1px solid;
        }
        .btn-insert { color: #1890ff; border-color: #1890ff; }
        .btn-insert:hover { background: #1890ff; color: #fff; opacity: 1; }
        .btn-copy { color: #52c41a; border-color: #52c41a; }
        .btn-copy:hover { background: #52c41a; color: #fff; opacity: 1; }

        #copilot-input-area { padding: 10px; border-top: 1px solid var(--item-hover-bg-color); background: var(--bg-color); border-radius: 0 0 8px 8px;}
        #copilot-input {
            width: 100%; height: 60px; resize: none; border: 1px solid var(--item-hover-bg-color);
            padding: 8px; background: var(--main-bg-color); color: var(--text-color);
            outline: none; border-radius: 4px;
        }
    `

    // --- HTML 结构：增加下拉选择框 ---
    html = () => `
        <div id="typora-copilot-panel">
            <div id="copilot-header">
                <div style="display:flex; align-items:center; gap:5px; font-weight:bold;">
                    <span>🤖</span>
                    <select id="model-select" title="切换 AI 模型"></select>
                </div>
                <span id="copilot-close" style="cursor:pointer; padding:5px;">✖</span>
            </div>
            
            <div id="copilot-toolbar">
                <div id="btn-ctx-none" class="toolbar-btn active" title="最省钱：仅发送输入的问题">🚫 无引用</div>
                <div id="btn-ctx-doc" class="toolbar-btn" title="耗费Token：发送当前全文作为参考">📄 全文引用</div>
                <div style="flex:1"></div>
                <div id="btn-clear" class="toolbar-btn" title="清空对话历史">🧹 清空</div>
            </div>

            <div id="copilot-messages"></div>

            <div id="copilot-input-area">
                <textarea id="copilot-input" placeholder="输入问题 (Shift+Enter 发送)..."></textarea>
            </div>
        </div>
    `

    hotkey = () => [this.config.hotkey]

    init = () => {
        this.panel = document.querySelector("#typora-copilot-panel");
        this.msgContainer = document.querySelector("#copilot-messages");
        this.inputBox = document.querySelector("#copilot-input");
        this.selectBox = document.querySelector("#model-select");
        
        this.contextMode = "none"; 
        this.chatHistory = [];
        
        // --- 1. 初始化模型列表 ---
        this.profiles = this.config.profiles || [];
        
        // 如果 TOML 里没有配置 profiles，则使用 root 配置生成一个默认的
        if (this.profiles.length === 0) {
            this.profiles.push({
                name: "默认模型",
                model: this.config.model || "glm-4-flash",
                apiKey: this.config.apiKey || "",
                apiUrl: this.config.apiUrl || "",
                max_context: this.config.max_context_chars || 8000
            });
        }

        // --- 2. 填充下拉框 ---
        this.profiles.forEach((p, index) => {
            const option = document.createElement("option");
            option.value = index;
            option.text = p.name || p.model;
            this.selectBox.appendChild(option);
        });

        // --- 3. 恢复上次选中的模型 ---
        const lastIndex = this.config.active_index || 0;
        if (this.profiles[lastIndex]) {
            this.selectBox.value = lastIndex;
            this.currentProfile = this.profiles[lastIndex];
        } else {
            this.selectBox.value = 0;
            this.currentProfile = this.profiles[0];
        }
        
        this.showInitMessage();
    }

    process = () => {
        document.querySelector("#copilot-close").onclick = () => this.panel.style.display = "none";
        
        // --- 模型切换逻辑 ---
        this.selectBox.onchange = (e) => {
            const index = parseInt(e.target.value);
            this.currentProfile = this.profiles[index];
            this.chatHistory = []; // 切换模型时清空历史，避免上下文混乱
            this.msgContainer.innerHTML = "";
            this.showInitMessage();
            
            // 尝试保存 active_index 到配置文件 (可选)
            this.saveActiveIndex(index);
        };

        const btnNone = document.querySelector("#btn-ctx-none");
        const btnDoc = document.querySelector("#btn-ctx-doc");
        btnNone.onclick = () => { this.contextMode = "none"; btnNone.classList.add("active"); btnDoc.classList.remove("active"); };
        btnDoc.onclick = () => { this.contextMode = "doc"; btnDoc.classList.add("active"); btnNone.classList.remove("active"); };

        document.querySelector("#btn-clear").onclick = () => {
            this.chatHistory = [];
            this.msgContainer.innerHTML = "";
            this.showInitMessage();
        };

        this.inputBox.onkeydown = (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                const text = this.inputBox.value.trim();
                if (text) this.doSend(text);
            }
        };
    }

    showInitMessage = () => {
        const info = `<div style="text-align:center; opacity:0.6; font-size:12px; margin-top:20px; padding-bottom:10px; border-bottom:1px dashed #eee;">
                        当前模型: <strong>${this.currentProfile.model}</strong><br>
                        API: ...${this.currentProfile.apiKey.slice(-4) || '无'}<br>
                        历史已重置
                      </div>`;
        this.msgContainer.innerHTML = info;
    }

    // 保存选中状态到 TOML (简单正则替换)
    saveActiveIndex = (index) => {
        try {
            const fs = reqnode('fs'); 
            const path = reqnode('path');
            const settingsPath = path.resolve(this.utils.getPluginFolder(), "../../global/settings/custom_plugin.user.toml");
            
            if (fs.existsSync(settingsPath)) {
                let content = fs.readFileSync(settingsPath, 'utf-8');
                // 替换 active_index = N
                const regex = /^active_index\s*=\s*\d+/m;
                if (regex.test(content)) {
                    content = content.replace(regex, `active_index = ${index}`);
                } else {
                    // 如果没找到，就在 [typoraCopilot] 下面添加
                    content = content.replace("[typoraCopilot]", `[typoraCopilot]\nactive_index = ${index}`);
                }
                fs.writeFileSync(settingsPath, content, 'utf-8');
                console.log("配置已保存：active_index =", index);
            }
        } catch(e) { console.error("保存配置失败", e); }
    }

    doSend = async (userText) => {
        this.inputBox.value = "";
        this.appendMessage("user", userText);

        let finalPrompt = userText;
        const selection = window.getSelection().toString().trim();
        const fullContent = this.utils.getFilePath() ? File.editor.sourceView.getValue() : "";

        // 使用当前 profile 的配置
        const maxContext = this.currentProfile.max_context || 8000;

        if (selection) {
            finalPrompt = `【请参考以下选中的文本】：\n${selection}\n\n【用户问题】：${userText}`;
        } else if (this.contextMode === "doc" && fullContent) {
            const safeContent = fullContent.substring(0, maxContext); 
            finalPrompt = `【请参考当前文档内容】：\n${safeContent}\n...\n\n【用户问题】：${userText}`;
        }

        this.chatHistory.push({ role: "user", content: finalPrompt });
        await this.streamResponse();
    }

    appendMessage = (role, text) => {
        const row = document.createElement("div");
        row.className = `msg-row msg-${role}`;
        
        const contentDiv = document.createElement("div");
        contentDiv.className = "msg-content";
        contentDiv.innerText = text;
        row.appendChild(contentDiv);

        if (role === "ai") {
            const actionBar = document.createElement("div");
            actionBar.className = "action-bar";
            
            const insertBtn = document.createElement("div");
            insertBtn.className = "action-btn btn-insert";
            insertBtn.innerHTML = "📥 插入";
            insertBtn.onclick = () => this.utils.insertText(null, row._rawText || contentDiv.innerText);
            
            const copyBtn = document.createElement("div");
            copyBtn.className = "action-btn btn-copy";
            copyBtn.innerHTML = "📋 复制 MD";
            copyBtn.onclick = () => {
                navigator.clipboard.writeText(row._rawText || contentDiv.innerText);
                copyBtn.innerHTML = "✅ 已复制";
                setTimeout(() => copyBtn.innerHTML = "📋 复制 MD", 1000);
            };

            actionBar.appendChild(insertBtn);
            actionBar.appendChild(copyBtn);
            row.appendChild(actionBar);
            row._contentText = contentDiv; 
        }

        this.msgContainer.appendChild(row);
        this.msgContainer.scrollTop = this.msgContainer.scrollHeight;
        return row;
    }

    streamResponse = async () => {
        const msgRow = this.appendMessage("ai", "Thinking...");
        const contentDiv = msgRow._contentText;
        let fullText = "";

        // 使用当前 profile 的配置
        const { apiUrl, apiKey, model } = this.currentProfile;

        try {
            const safeHistory = this.chatHistory.slice(-6); 
            const response = await fetch(apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
                body: JSON.stringify({ model: model, messages: safeHistory, stream: true })
            });

            if (!response.ok) throw new Error(await response.text());

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            contentDiv.innerText = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, {stream: true});
                chunk.split('\n').forEach(line => {
                    if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                        try {
                            const delta = JSON.parse(line.substring(6)).choices[0].delta.content;
                            if (delta) {
                                fullText += delta;
                                contentDiv.innerText = fullText;
                                msgRow._rawText = fullText; 
                                this.msgContainer.scrollTop = this.msgContainer.scrollHeight;
                            }
                        } catch (e) {}
                    }
                });
            }
            this.chatHistory.push({ role: "assistant", content: fullText });
        } catch (error) {
            contentDiv.innerText = "Error: " + error.message;
            contentDiv.style.color = "red";
        }
    }

    callback = anchorNode => {
        this.panel.style.display = "flex";
        this.inputBox.focus();
        const selection = window.getSelection().toString().trim();
        if (selection) this.inputBox.placeholder = "已选中文本，直接提问即可...";
    }
}

module.exports = { plugin: typoraCopilot }