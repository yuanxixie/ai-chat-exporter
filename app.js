// ========== Global Variables ==========

let loadedData = null;
let availableDates = new Set();
let currentMonth = new Date();

// ========== Date Mode Toggle ==========

function toggleDateMode() {
    const mode = document.querySelector('input[name="dateMode"]:checked').value;
    
    document.getElementById('singleDatePicker').style.display = mode === 'single' ? 'block' : 'none';
    document.getElementById('rangeDatePicker').style.display = mode === 'range' ? 'block' : 'none';
    document.getElementById('allDatesInfo').style.display = mode === 'all' ? 'block' : 'none';
}

// ========== Re-parse File on Platform Change ==========

function onPlatformChange() {
    if (loadedData) {
        parseLoadedData();
    }
}

// ========== Parse File and Show Calendar on File Select ==========

function onFileSelected() {
    const fileInput = document.getElementById('fileInput');
    
    if (!fileInput.files[0]) return;

    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            loadedData = JSON.parse(e.target.result);
            parseLoadedData();
        } catch (error) {
            document.getElementById('calendarContainer').style.display = 'none';
            alert('Failed to parse file');
        }
    };

    reader.readAsText(fileInput.files[0]);
}

function parseLoadedData() {
    const platform = document.getElementById('platformSelect').value;
    availableDates = new Set(extractDates(loadedData, platform));
    
    if (availableDates.size === 0) {
        document.getElementById('calendarContainer').style.display = 'none';
        alert('No conversations found');
        return;
    }
    
    // Find the most recent month with conversations
    const sortedDates = Array.from(availableDates).sort().reverse();
    const latestDate = new Date(sortedDates[0]);
    currentMonth = new Date(latestDate.getFullYear(), latestDate.getMonth(), 1);
    
    document.getElementById('calendarContainer').style.display = 'block';
    renderCalendar();
}

function extractDates(data, platform) {
    const dateSet = new Set();
    
    for (const conversation of data) {
        let dateStr;
        
        try {
            if (platform === 'claude') {
                if (conversation.created_at) {
                    dateStr = conversation.created_at.split('T')[0];
                }
            } else if (platform === 'chatgpt') {
                if (conversation.create_time) {
                    dateStr = unixToDate(conversation.create_time);
                }
            }
            
            if (dateStr) {
                dateSet.add(dateStr);
            }
        } catch (e) {
            continue;
        }
    }
    
    return Array.from(dateSet).sort().reverse();
}

// ========== Calendar Rendering ==========

function renderCalendar() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Update title
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    document.getElementById('calendarMonth').textContent = `${monthNames[month]} ${year}`;
    
    // Build calendar grid
    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';
    
    // Weekday headers
    const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    for (const day of weekdays) {
        grid.innerHTML += `<div class="calendar-weekday">${day}</div>`;
    }
    
    // Get the first day of the month (0 = Sunday)
    const firstDay = new Date(year, month, 1).getDay();
    
    // Get the number of days in this month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Today's date
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    // Fill empty cells
    for (let i = 0; i < firstDay; i++) {
        grid.innerHTML += `<div class="calendar-day"></div>`;
    }
    
    // Fill dates
    let daysWithData = 0;
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const hasData = availableDates.has(dateStr);
        const isToday = dateStr === todayStr;
        const isSelected = dateStr === document.getElementById('dateInput').value;
        
        if (hasData) daysWithData++;
        
        let classes = 'calendar-day';
        if (hasData) classes += ' has-data';
        if (isToday) classes += ' today';
        if (isSelected) classes += ' selected';
        
        const onclick = hasData ? `onclick="selectDate('${dateStr}')"` : '';
        
        grid.innerHTML += `<div class="${classes}" ${onclick}>${day}</div>`;
    }
    
    // Update stats
    document.getElementById('calendarStats').textContent = 
        `${daysWithData} days this month · ${availableDates.size} days total`;
}

function changeMonth(delta) {
    currentMonth.setMonth(currentMonth.getMonth() + delta);
    renderCalendar();
}

function selectDate(date) {
    document.getElementById('dateInput').value = date;
    renderCalendar();
}

// ========== Unix Timestamp to Date ==========

function unixToDate(timestamp) {
    const date = new Date(timestamp * 1000);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// ========== Get Filename Suffix ==========

function getSenderSuffix(senderFilter) {
    if (senderFilter === 'human') return 'user-only';
    if (senderFilter === 'assistant') return 'ai-only';
    return 'both';
}

// ========== Main Export Function ==========

function exportChat() {
    const platformSelect = document.getElementById('platformSelect');
    const senderSelect = document.getElementById('senderSelect');
    const formatSelect = document.getElementById('formatSelect');
    const status = document.getElementById('status');
    const dateMode = document.querySelector('input[name="dateMode"]:checked').value;

    if (!loadedData) {
        status.textContent = 'Please select a JSON file first';
        status.style.color = '#999';
        return;
    }

    const platform = platformSelect.value;
    
    if (dateMode === 'single') {
        exportSingleDate(loadedData, platform, senderSelect.value, formatSelect.value, status);
    } else if (dateMode === 'range') {
        exportDateRange(loadedData, platform, senderSelect.value, formatSelect.value, status);
    } else if (dateMode === 'all') {
        exportAllDates(loadedData, platform, senderSelect.value, formatSelect.value, status);
    }
}

// Single date export
function exportSingleDate(data, platform, senderFilter, format, status) {
    const dateInput = document.getElementById('dateInput');
    
    if (!dateInput.value) {
        status.textContent = 'Please select a date';
        status.style.color = '#999';
        return;
    }
    
    let result;
    if (platform === 'claude') {
        result = processClaudeData(data, dateInput.value, senderFilter);
    } else if (platform === 'chatgpt') {
        result = processChatGPTData(data, dateInput.value, senderFilter);
    }
    
    if (result.length === 0) {
        status.textContent = 'No conversations found for this date';
        status.style.color = '#999';
        return;
    }

    downloadFile(result, dateInput.value, platform, senderFilter, format);
    status.textContent = 'Export successful!';
    status.style.color = '#000';
}

// Date range export
function exportDateRange(data, platform, senderFilter, format, status) {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (!startDate || !endDate) {
        status.textContent = 'Please select start and end dates';
        status.style.color = '#999';
        return;
    }
    
    if (startDate > endDate) {
        status.textContent = 'Start date cannot be after end date';
        status.style.color = '#999';
        return;
    }
    
    const datesInRange = Array.from(availableDates).filter(date => date >= startDate && date <= endDate);
    
    if (datesInRange.length === 0) {
        status.textContent = 'No conversations found in this date range';
        status.style.color = '#999';
        return;
    }
    
    let exportedCount = 0;
    
    for (const date of datesInRange) {
        let result;
        if (platform === 'claude') {
            result = processClaudeData(data, date, senderFilter);
        } else if (platform === 'chatgpt') {
            result = processChatGPTData(data, date, senderFilter);
        }
        
        if (result.length > 0) {
            downloadFile(result, date, platform, senderFilter, format);
            exportedCount++;
        }
    }
    
    status.textContent = `Export successful! ${exportedCount} files`;
    status.style.color = '#000';
}

// Export all dates
function exportAllDates(data, platform, senderFilter, format, status) {
    if (availableDates.size === 0) {
        status.textContent = 'No conversations found';
        status.style.color = '#999';
        return;
    }
    
    let exportedCount = 0;
    
    for (const date of availableDates) {
        let result;
        if (platform === 'claude') {
            result = processClaudeData(data, date, senderFilter);
        } else if (platform === 'chatgpt') {
            result = processChatGPTData(data, date, senderFilter);
        }
        
        if (result.length > 0) {
            downloadFile(result, date, platform, senderFilter, format);
            exportedCount++;
        }
    }
    
    status.textContent = `Export successful! ${exportedCount} files`;
    status.style.color = '#000';
}

// ========== Claude Parser ==========

function processClaudeData(data, targetDate, senderFilter) {
    let output = [];
    
    output.push(`# ${targetDate}\n`);

    for (const conversation of data) {
        if (!conversation.created_at) continue;
        
        const convDate = conversation.created_at.split('T')[0];

        if (convDate !== targetDate) {
            continue;
        }

        output.push(`## ${conversation.name || 'Untitled'}\n`);

        if (!conversation.chat_messages) continue;

        let messageCount = 0;
        for (const message of conversation.chat_messages) {
            if (senderFilter !== 'both' && message.sender !== senderFilter) {
                continue;
            }

            const content = message.text || '';

            if (content) {
                if (senderFilter === 'both') {
                    // Export both: label sender
                    const senderLabel = message.sender === 'human' ? 'Me' : 'Claude';
                    output.push(`**${senderLabel}:**\n${content}\n`);
                } else {
                    // Export single: separate with horizontal rule
                    if (messageCount > 0) {
                        output.push('---\n');
                    }
                    output.push(`${content}\n`);
                    messageCount++;
                }
            }
        }

        output.push('\n---\n');
    }

    return output.join('\n');
}

// ========== ChatGPT Parser ==========

function processChatGPTData(data, targetDate, senderFilter) {
    let output = [];
    
    output.push(`# ${targetDate}\n`);

    for (const conversation of data) {
        if (!conversation.create_time) continue;
        
        const convDate = unixToDate(conversation.create_time);

        if (convDate !== targetDate) {
            continue;
        }

        output.push(`## ${conversation.title || 'Untitled'}\n`);

        const mapping = conversation.mapping;
        if (!mapping) continue;
        
        const messages = [];
        for (const key in mapping) {
            const node = mapping[key];
            if (node.message && node.message.content && node.message.content.parts) {
                const role = node.message.author.role;
                
                if (role === 'system') continue;
                
                if (senderFilter === 'human' && role !== 'user') continue;
                if (senderFilter === 'assistant' && role !== 'assistant') continue;
                
                const content = node.message.content.parts.join('\n');
                
                if (content && content.trim()) {
                    messages.push({
                        role: role,
                        content: content,
                        time: node.message.create_time || 0
                    });
                }
            }
        }
        
        // Sort by time
        messages.sort((a, b) => a.time - b.time);
        
        let messageCount = 0;
        for (const msg of messages) {
            if (senderFilter === 'both') {
                // Export both: label sender
                const senderLabel = msg.role === 'user' ? 'Me' : 'ChatGPT';
                output.push(`**${senderLabel}:**\n${msg.content}\n`);
            } else {
                // Export single: separate with horizontal rule
                if (messageCount > 0) {
                    output.push('---\n');
                }
                output.push(`${msg.content}\n`);
                messageCount++;
            }
        }

        output.push('\n---\n');
    }

    return output.join('\n');
}

// ========== Download File ==========

function downloadFile(content, date, platform, senderFilter, format) {
    const extension = format === 'markdown' ? 'md' : 'txt';
    const senderSuffix = getSenderSuffix(senderFilter);
    const filename = `${platform}-${date}-${senderSuffix}.${extension}`;
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    
    URL.revokeObjectURL(url);
}