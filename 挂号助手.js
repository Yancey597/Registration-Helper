// ==UserScript==
// @name         杭州市妇幼保健院挂号助手
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  基于实际页面结构的自动抢号脚本
// @author       Yanecy_Lu
// @match        https://wx.hzwmhp.com:456/hfy_yygh/vue/index.html*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    // 配置参数
    const CONFIG = {
        targetDate: '09-14', // 目标日期，格式如 '09-14'
        clickInterval: 500,   // 点击间隔(毫秒)
        maxRetries: 2000,     // 最大重试次数
        startTime: '13:59:50', // 自动开始时间
        preferredTimeSlot: 0,  // 优先选择的时段索引(0为第一个)
        autoStart: false,      // 是否自动启动
        doctorType: 'any',     // 医生类型：'expert'=专家号, 'general'=普通号, 'any'=任意
        timePreference: 'any', // 时间偏好：'morning'=上午, 'afternoon'=下午, 'any'=任意
        specificSlot: 0        // 具体时段序号（0为第一个）
    };
    
    let isRunning = false;
    let retryCount = 0;
    let logContainer;
    let foundAppointment = false;
    
    // 拖拽相关变量
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };
    
    // 创建控制面板
    function createControlPanel() {
        const panel = document.createElement('div');
        panel.id = 'grab-ticket-panel';
        panel.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 320px;
            background: #fff;
            border: 2px solid #ed7084;
            border-radius: 8px;
            padding: 15px;
            z-index: 99999;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            font-size: 14px;
            user-select: none;
        `;
        
        panel.innerHTML = `
            <div id="panel-header" style="background: #ed7084; color: white; margin: -15px -15px 15px -15px; padding: 12px; border-radius: 6px 6px 0 0; cursor: move;">
                <h3 style="margin: 0; text-align: center; font-size: 16px;">🏥 杭州妇幼挂号助手</h3>
                <div style="text-align: center; font-size: 10px; opacity: 0.8; margin-top: 2px;">Author: Yanecy_Lu</div>
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 8px;">目标日期: 
                    <input type="text" id="targetDate" value="${CONFIG.targetDate}" 
                           style="width: 80px; padding: 4px; border: 1px solid #ddd; border-radius: 4px;">
                </label>
                
                <label style="display: block; margin-bottom: 8px;">医生类型: 
                    <select id="doctorType" style="width: 120px; padding: 4px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="any">任意</option>
                        <option value="expert">专家号</option>
                        <option value="general">普通号</option>
                    </select>
                </label>
                
                <label style="display: block; margin-bottom: 8px;">时间偏好: 
                    <select id="timePreference" style="width: 120px; padding: 4px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="any">任意</option>
                        <option value="morning">上午</option>
                        <option value="afternoon">下午</option>
                    </select>
                </label>
                
                <label style="display: block; margin-bottom: 8px;">时段选择: 
                    <select id="specificSlot" style="width: 120px; padding: 4px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="0">第1个时段</option>
                        <option value="1">第2个时段</option>
                        <option value="2">第3个时段</option>
                        <option value="3">第4个时段</option>
                        <option value="4">第5个时段</option>
                        <option value="5">第6个时段</option>
                        <option value="6">第7个时段</option>
                        <option value="7">第8个时段</option>
                        <option value="8">第9个时段</option>
                        <option value="9">第10个时段</option>
                        <option value="10">第11个时段</option>
                    </select>
                </label>
                
                <label style="display: block; margin-bottom: 8px;">点击间隔: 
                    <input type="number" id="clickInterval" value="${CONFIG.clickInterval}" 
                           style="width: 80px; padding: 4px; border: 1px solid #ddd; border-radius: 4px;"> ms
                </label>
                <label style="display: block; margin-bottom: 8px;">
                    <input type="checkbox" id="autoStart"> 
                    自动启动 (13:59:50)
                </label>
            </div>
            <div style="margin-bottom: 15px;">
                <button id="startGrab" style="background: #27ae60; color: white; border: none; padding: 10px 16px; border-radius: 4px; cursor: pointer; width: 100%; margin-bottom: 5px;">开始抢号</button>
                <button id="stopGrab" style="background: #e74c3c; color: white; border: none; padding: 10px 16px; border-radius: 4px; cursor: pointer; width: 100%;" disabled>停止抢号</button>
            </div>
            <div id="status" style="background: #f8f9fa; border-radius: 4px; padding: 10px; max-height: 250px; overflow-y: auto; font-size: 12px; line-height: 1.4;"></div>
        `;
        
        document.body.appendChild(panel);
        
        logContainer = document.getElementById('status');
        
        // 设置默认值
        document.getElementById('doctorType').value = CONFIG.doctorType;
        document.getElementById('timePreference').value = CONFIG.timePreference;
        document.getElementById('specificSlot').value = CONFIG.specificSlot;
        document.getElementById('autoStart').checked = CONFIG.autoStart;
        
        // 绑定拖拽事件
        setupDragEvents(panel);
        
        // 绑定其他事件
        document.getElementById('startGrab').addEventListener('click', startGrabbing);
        document.getElementById('stopGrab').addEventListener('click', stopGrabbing);
        document.getElementById('targetDate').addEventListener('input', (e) => {
            CONFIG.targetDate = e.target.value;
        });
        document.getElementById('doctorType').addEventListener('change', (e) => {
            CONFIG.doctorType = e.target.value;
        });
        document.getElementById('timePreference').addEventListener('change', (e) => {
            CONFIG.timePreference = e.target.value;
        });
        document.getElementById('specificSlot').addEventListener('change', (e) => {
            CONFIG.specificSlot = parseInt(e.target.value);
        });
        document.getElementById('clickInterval').addEventListener('input', (e) => {
            CONFIG.clickInterval = parseInt(e.target.value);
        });
        document.getElementById('autoStart').addEventListener('change', (e) => {
            CONFIG.autoStart = e.target.checked;
        });
    }
    
    // 设置拖拽功能
    function setupDragEvents(panel) {
        const header = document.getElementById('panel-header');
        
        header.addEventListener('mousedown', (e) => {
            isDragging = true;
            const rect = panel.getBoundingClientRect();
            dragOffset.x = e.clientX - rect.left;
            dragOffset.y = e.clientY - rect.top;
            
            // 添加全局事件监听
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            
            // 防止选择文本
            e.preventDefault();
        });
        
        function handleMouseMove(e) {
            if (!isDragging) return;
            
            const newX = e.clientX - dragOffset.x;
            const newY = e.clientY - dragOffset.y;
            
            // 确保面板不会被拖拽到屏幕外
            const maxX = window.innerWidth - panel.offsetWidth;
            const maxY = window.innerHeight - panel.offsetHeight;
            
            const clampedX = Math.max(0, Math.min(newX, maxX));
            const clampedY = Math.max(0, Math.min(newY, maxY));
            
            panel.style.left = clampedX + 'px';
            panel.style.top = clampedY + 'px';
            panel.style.right = 'auto'; // 移除右侧定位
        }
        
        function handleMouseUp() {
            isDragging = false;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        }
    }
    
    // 日志函数
    function log(message, type = 'info') {
        const time = new Date().toLocaleTimeString();
        const colors = {
            info: '#333',
            success: '#27ae60',
            error: '#e74c3c',
            warning: '#f39c12'
        };
        
        const logEntry = document.createElement('div');
        logEntry.style.cssText = `color: ${colors[type]}; margin-bottom: 2px;`;
        logEntry.innerHTML = `[${time}] ${message}`;
        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;
        
        console.log(`[杭州妇幼挂号助手] ${message}`);
    }
    
    // 点击目标日期
    function clickTargetDate() {
        // 根据HTML结构，查找日期元素 .item_menu_1_tv_date
        const dateElements = document.querySelectorAll('.item_menu_1_tv_date');
        
        for (let element of dateElements) {
            if (element.textContent.trim() === CONFIG.targetDate) {
                // 点击整个日期项容器
                const menuItem = element.closest('.item_menu, .item_menu_check');
                if (menuItem) {
                    menuItem.click();
                    return true;
                }
            }
        }
        
        return false;
    }
    
    // 检查预约按钮
    function checkForAppointmentButton() {
        // 根据HTML结构查找预约按钮 .list_btn（不包含 .list_btn_no 和 .list_btn_hb）
        const appointmentButtons = document.querySelectorAll('.list_btn:not(.list_btn_no):not(.list_btn_hb)');
        
        for (let button of appointmentButtons) {
            if (button.textContent.trim() === '预约' && button.offsetParent !== null) {
                // 获取医生信息
                const doctorContainer = button.closest('.div_item_doctor');
                if (!doctorContainer) continue;
                
                const doctorNameElement = doctorContainer.querySelector('.list_name');
                const doctorName = doctorNameElement ? doctorNameElement.textContent.trim() : '未知医生';
                
                // 判断医生类型
                const doctorInfo = doctorContainer.textContent;
                const isExpert = doctorInfo.includes('主任医师') || 
                               doctorInfo.includes('副主任医师') || 
                               doctorInfo.includes('主治医师');
                const isGeneral = doctorName.includes('普通门诊') || doctorName.includes('普通');
                
                // 根据配置过滤医生类型
                if (CONFIG.doctorType === 'expert' && !isExpert) continue;
                if (CONFIG.doctorType === 'general' && !isGeneral) continue;
                
                // 检查时间偏好
                const timeSection = getTimeSection(doctorContainer);
                if (CONFIG.timePreference === 'morning' && timeSection !== 'morning') continue;
                if (CONFIG.timePreference === 'afternoon' && timeSection !== 'afternoon') continue;
                
                return { 
                    button: button, 
                    doctor: doctorName,
                    isExpert: isExpert,
                    timeSection: timeSection
                };
            }
        }
        
        return null;
    }
    
    // 获取医生所在的时间段
    function getTimeSection(doctorContainer) {
        // 向上查找到包含时间段标题的元素
        let currentElement = doctorContainer;
        while (currentElement && currentElement.parentElement) {
            const prevSibling = currentElement.previousElementSibling;
            if (prevSibling && prevSibling.classList.contains('type_title')) {
                const titleText = prevSibling.textContent.trim();
                if (titleText.includes('上午')) return 'morning';
                if (titleText.includes('下午')) return 'afternoon';
            }
            currentElement = currentElement.parentElement;
        }
        
        // 如果找不到，尝试从页面结构推断
        const allTitles = document.querySelectorAll('.type_title');
        for (let i = 0; i < allTitles.length; i++) {
            const title = allTitles[i];
            const titleText = title.textContent.trim();
            
            // 获取该标题后的所有医生容器
            let nextElement = title.nextElementSibling;
            while (nextElement) {
                if (nextElement.contains(doctorContainer)) {
                    if (titleText.includes('上午')) return 'morning';
                    if (titleText.includes('下午')) return 'afternoon';
                }
                if (nextElement.classList && nextElement.classList.contains('type_title')) {
                    break; // 遇到下一个标题，停止查找
                }
                nextElement = nextElement.nextElementSibling;
            }
        }
        
        return 'any';
    }
    
    // 等待元素出现
    function waitForElement(selector, timeout = 3000) {
        return new Promise((resolve, reject) => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
                return;
            }
            
            const observer = new MutationObserver(() => {
                const element = document.querySelector(selector);
                if (element) {
                    observer.disconnect();
                    resolve(element);
                }
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            
            setTimeout(() => {
                observer.disconnect();
                reject(new Error('元素未找到'));
            }, timeout);
        });
    }
    
    // 选择时段
    async function selectTimeSlot() {
        try {
            log('等待时段列表加载...', 'info');
            
            // 等待时段选择弹窗出现
            await waitForElement('.van-action-sheet__item', 3000);
            
            // 获取所有时段按钮
            const timeSlotButtons = document.querySelectorAll('.van-action-sheet__item');
            
            if (timeSlotButtons.length > 0) {
                // 使用配置的具体时段索引
                const targetSlot = timeSlotButtons[CONFIG.specificSlot] || timeSlotButtons[0];
                const slotText = targetSlot.textContent.trim();
                
                targetSlot.click();
                log(`已选择时段: ${slotText} (第${CONFIG.specificSlot + 1}个)`, 'success');
                return true;
            }
            
            log('未找到可用时段', 'warning');
            return false;
        } catch (error) {
            log(`选择时段失败: ${error.message}`, 'error');
            return false;
        }
    }
    
    // 确认预约
    async function confirmAppointment() {
        try {
            log('开始确认预约流程...', 'info');
            
            // 等待确认页面加载
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // 查找确认按钮 .div_footer（包含"确认预约"文本）
            let confirmBtn = document.querySelector('.div_footer');
            if (confirmBtn && confirmBtn.textContent.includes('确认预约')) {
                confirmBtn.click();
                log('已点击确认预约按钮', 'success');
                
                // 等待弹窗出现并处理二次确认
                await new Promise(resolve => setTimeout(resolve, 800));
                
                // 查找弹窗中的确认按钮 .van-dialog__confirm
                const modalConfirmBtn = document.querySelector('.van-dialog__confirm');
                if (modalConfirmBtn && modalConfirmBtn.offsetParent !== null) {
                    modalConfirmBtn.click();
                    log('🎉 预约成功！已完成二次确认！', 'success');
                    stopGrabbing();
                    return true;
                }
            }
            
            log('未找到确认按钮', 'warning');
            return false;
        } catch (error) {
            log(`确认预约失败: ${error.message}`, 'error');
            return false;
        }
    }
    
    // 主要抢号逻辑
    async function grabTicket() {
        if (!isRunning || foundAppointment) return;
        
        retryCount++;
        log(`第 ${retryCount} 次尝试 - 目标: ${CONFIG.targetDate}`);
        
        try {
            // 1. 点击目标日期
            const dateClicked = clickTargetDate();
            if (!dateClicked) {
                log(`未找到日期 ${CONFIG.targetDate}`, 'warning');
            }
            
            // 2. 等待页面响应
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // 3. 检查是否有预约按钮出现
            const appointmentInfo = checkForAppointmentButton();
            if (appointmentInfo) {
                foundAppointment = true;
                const doctorType = appointmentInfo.isExpert ? '专家' : '普通';
                const timeSection = appointmentInfo.timeSection === 'morning' ? '上午' : 
                                  appointmentInfo.timeSection === 'afternoon' ? '下午' : '未知';
                
                log(`🎯 发现符合条件的医生: ${appointmentInfo.doctor} (${doctorType}, ${timeSection})`, 'success');
                
                // 4. 点击预约按钮
                appointmentInfo.button.click();
                log('已点击预约按钮，等待时段选择...', 'success');
                
                // 5. 选择时段
                const timeSelected = await selectTimeSlot();
                if (timeSelected) {
                    // 6. 确认预约
                    await confirmAppointment();
                } else {
                    log('时段选择失败，继续监控...', 'warning');
                    foundAppointment = false;
                }
            }
            
        } catch (error) {
            log(`抢号过程出错: ${error.message}`, 'error');
        }
        
        // 检查是否达到最大重试次数
        if (retryCount >= CONFIG.maxRetries) {
            log(`已达到最大重试次数 ${CONFIG.maxRetries}，停止抢号`, 'error');
            stopGrabbing();
            return;
        }
        
        // 继续下一次尝试
        if (isRunning && !foundAppointment) {
            setTimeout(grabTicket, CONFIG.clickInterval);
        }
    }
    
    // 开始抢号
    function startGrabbing() {
        isRunning = true;
        retryCount = 0;
        foundAppointment = false;
        
        document.getElementById('startGrab').disabled = true;
        document.getElementById('stopGrab').disabled = false;
        
        // 更新配置
        CONFIG.targetDate = document.getElementById('targetDate').value;
        CONFIG.doctorType = document.getElementById('doctorType').value;
        CONFIG.timePreference = document.getElementById('timePreference').value;
        CONFIG.specificSlot = parseInt(document.getElementById('specificSlot').value);
        CONFIG.clickInterval = parseInt(document.getElementById('clickInterval').value);
        
        log('🚀 开始自动抢号...', 'success');
        log(`📅 目标日期: ${CONFIG.targetDate}`, 'info');
        
        const doctorTypeText = {
            'any': '任意医生',
            'expert': '专家号',
            'general': '普通号'
        }[CONFIG.doctorType];
        log(`👨‍⚕️ 医生类型: ${doctorTypeText}`, 'info');
        
        const timeText = {
            'any': '任意时间',
            'morning': '上午',
            'afternoon': '下午'
        }[CONFIG.timePreference];
        log(`🕐 时间偏好: ${timeText}`, 'info');
        
        log(`🎯 目标时段: 第${CONFIG.specificSlot + 1}个时段`, 'info');
        log(`⏱️ 点击间隔: ${CONFIG.clickInterval}ms`, 'info');
        
        grabTicket();
    }
    
    // 停止抢号
    function stopGrabbing() {
        isRunning = false;
        foundAppointment = false;
        
        document.getElementById('startGrab').disabled = false;
        document.getElementById('stopGrab').disabled = true;
        
        log('⏹️ 已停止抢号', 'warning');
    }
    
    // 定时启动功能
    function checkAutoStart() {
        const now = new Date();
        const currentTime = now.toTimeString().substr(0, 8);
        
        if (currentTime === CONFIG.startTime && !isRunning && CONFIG.autoStart) {
            log('⏰ 达到预定时间，自动开始抢号！', 'success');
            startGrabbing();
        }
    }
    
    // 页面监控 - 检测页面变化
    function monitorPageChanges() {
        const observer = new MutationObserver((mutations) => {
            if (!isRunning) return;
            
            mutations.forEach((mutation) => {
                // 检测是否有新的预约按钮出现
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1 && node.querySelector && node.querySelector('.list_btn')) {
                            // 有新的按钮出现，可能是预约按钮
                            setTimeout(() => {
                                if (isRunning && !foundAppointment) {
                                    const appointmentInfo = checkForAppointmentButton();
                                    if (appointmentInfo) {
                                        const doctorType = appointmentInfo.isExpert ? '专家' : '普通';
                                        const timeSection = appointmentInfo.timeSection === 'morning' ? '上午' : 
                                                          appointmentInfo.timeSection === 'afternoon' ? '下午' : '未知';
                                        
                                        log(`🎯 检测到新的预约机会: ${appointmentInfo.doctor} (${doctorType}, ${timeSection})`, 'success');
                                        foundAppointment = true;
                                        appointmentInfo.button.click();
                                        log('已点击预约按钮，等待时段选择...', 'success');
                                        
                                        // 处理时段选择和确认
                                        setTimeout(async () => {
                                            const timeSelected = await selectTimeSlot();
                                            if (timeSelected) {
                                                await confirmAppointment();
                                            } else {
                                                foundAppointment = false;
                                            }
                                        }, 500);
                                    }
                                }
                            }, 100);
                        }
                    });
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    // 初始化
    function init() {
        // 等待页面加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => {
                    createControlPanel();
                    monitorPageChanges();
                }, 1000);
            });
        } else {
            setTimeout(() => {
                createControlPanel();
                monitorPageChanges();
            }, 1000);
        }
        
        // 每秒检查是否需要自动启动
        setInterval(checkAutoStart, 1000);
        
        log('✅ 杭州妇幼挂号助手已就绪', 'success');
        log('📋 请设置目标日期后点击开始抢号', 'info');
        log('⏰ 可设置自动启动时间为13:59:50', 'info');
        log('🖱️ 可拖拽面板标题栏移动位置', 'info');
    }
    
    init();
})();
