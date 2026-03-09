// ui.js - DOM rendering and countdown logic

// 导入 i18n
if (typeof t === 'undefined') {
    const script = document.createElement('script');
    script.src = '/static/js/i18n.js';
    document.head.appendChild(script);
}

// UI 类
class UI {
    static renderAlert(message, type = 'success') {
        const alert = document.createElement('div');
        alert.className = `alert ${type}`;
        alert.textContent = message;
        
        document.body.appendChild(alert);
        
        setTimeout(() => {
            alert.remove();
        }, 5000);
    }
    
    static renderModal(content) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                ${content}
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close modal when clicking X
        modal.querySelector('.close').addEventListener('click', () => {
            modal.remove();
        });
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        return modal;
    }
    
    static async showCountdown(seconds = 10) {
        return new Promise((resolve) => {
            const modal = this.renderModal(`
                <h2>${t('countdown').replace('{seconds}', seconds)}</h2>
                <div class="countdown">${seconds}</div>
            `);
            
            const countdownEl = modal.querySelector('.countdown');
            let remaining = seconds;
            
            const interval = setInterval(() => {
                remaining--;
                countdownEl.textContent = remaining;
                
                if (remaining <= 0) {
                    clearInterval(interval);
                    modal.remove();
                    resolve();
                }
            }, 1000);
        });
    }
    
    static renderAccountList(accounts) {
        const list = document.createElement('ul');
        list.className = 'account-list';
        
        accounts.forEach(account => {
            const li = document.createElement('li');
            li.innerHTML = `
                <strong>${account.alias}</strong>: ${account.address}
                <button class="delete-account" data-alias="${account.alias}">Delete</button>
            `;
            list.appendChild(li);
        });
        
        return list;
    }
    
    static renderLegalIntercept() {
        const intercept = document.createElement('div');
        intercept.className = 'legal-intercept';
        intercept.innerHTML = `
            <h2>${t('disclaimer_title')}</h2>
            <div class="terms">${t('disclaimer_content')}</div>
            <div>
                <input type="checkbox" id="accept-terms">
                <label for="accept-terms">I have read and understood the terms</label>
            </div>
            <div>
                <input type="text" id="accept-text" placeholder="${t('accept_risk')}">
            </div>
            <button class="accept-btn" disabled>${t('accept_risk')}</button>
        `;
        
        document.body.appendChild(intercept);
        
        // Enable button when conditions are met
        const acceptTerms = intercept.querySelector('#accept-terms');
        const acceptText = intercept.querySelector('#accept-text');
        const acceptBtn = intercept.querySelector('.accept-btn');
        
        function checkConditions() {
            const termsAccepted = acceptTerms.checked;
            const textAccepted = acceptText.value.trim() === t('accept_risk');
            acceptBtn.disabled = !(termsAccepted && textAccepted);
        }
        
        acceptTerms.addEventListener('change', checkConditions);
        acceptText.addEventListener('input', checkConditions);
        
        return new Promise((resolve) => {
            acceptBtn.addEventListener('click', () => {
                intercept.remove();
                resolve();
            });
        });
    }
    
    static showTransactionWarning() {
        return new Promise((resolve) => {
            const modal = this.renderModal(`
                <h2 class="unsafe">${t('transaction_warning')}</h2>
                <p>${t('confirm_transaction')}</p>
                <button class="unsafe">${t('confirm_transaction')}</button>
            `);
            
            modal.querySelector('button').addEventListener('click', () => {
                modal.remove();
                resolve();
            });
        });
    }
    
    static updateNavigationBar() {
        const nav = document.querySelector('nav');
        if (nav) {
            // Add warning bar
            const warningBar = document.createElement('div');
            warningBar.className = 'warning-bar';
            warningBar.textContent = '⚠️ HIGH RISK: You are responsible for your private keys';
            nav.insertBefore(warningBar, nav.firstChild);
        }
    }
    
    static markUnsafeElements() {
        const unsafeElements = document.querySelectorAll('.unsafe');
        unsafeElements.forEach(el => {
            el.innerHTML += ` <span class="unsafe">${t('unsafe')}</span>`;
        });
        
        const safeElements = document.querySelectorAll('.safe');
        safeElements.forEach(el => {
            el.innerHTML += ` <span class="safe">${t('safe')}</span>`;
        });
    }
}

// 暴露到全局作用域
window.UI = UI;
