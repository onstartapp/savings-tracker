// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA9TknQSbU0LTJcjPk7mtUGP6vUvWsALs8",
  authDomain: "gibogi-goal-tracker.firebaseapp.com",
  projectId: "gibogi-goal-tracker",
  storageBucket: "gibogi-goal-tracker.firebasestorage.app",
  messagingSenderId: "910687822923",
  appId: "1:910687822923:web:c9f1e804569f480111d9ce",
  measurementId: "G-YLHGZ2Q30X"
};


// Firebase'i başlat
firebase.initializeApp(firebaseConfig);

// Firebase servislerini al
const auth = firebase.auth();
const db = firebase.firestore();

// DOM elementlerini seç
const loadingScreen = document.getElementById('loadingScreen');
const appContent = document.getElementById('appContent');
const logoutButton = document.getElementById('logoutButton');
const userEmail = document.getElementById('userEmail');

const amountInput = document.getElementById('amountInput');
const descriptionInput = document.getElementById('descriptionInput');
const addAmountButton = document.getElementById('addAmountButton');
const totalSavingsSpan = document.getElementById('totalSavings');
const targetAmountSpan = document.getElementById('targetAmount');
const remainingAmountSpan = document.getElementById('remainingAmount');
const percentageAchievedSpan = document.getElementById('percentageAchieved');
const progressFill = document.getElementById('progressFill');
const transactionList = document.getElementById('transactionList');

let TARGET_AMOUNT = 750000; // Default target amount
let SHOW_DETAILED_STATS = true; // Default to show detailed stats

let totalSavings = 0; // Current total savings
let currentUser = null;

// Authentication state observer
auth.onAuthStateChanged((user) => {
    if (user) {
        // User logged in
        currentUser = user;
        userEmail.textContent = user.email;
        loadProjectSettings(); // Load project settings
        loadTransactions();
    } else {
        // Test user check
        const isTestUser = localStorage.getItem('testUser');
        if (isTestUser === 'true') {
            currentUser = {
                uid: 'test-user-id',
                email: localStorage.getItem('testUserEmail') || 'admin@test.com'
            };
            userEmail.textContent = currentUser.email;
            loadProjectSettings(); // Load project settings
            loadTransactions();
        } else {
            // User not logged in, redirect to login page
            window.location.href = 'login.html';
        }
    }
});

// Loading control functions
function showLoading() {
    loadingScreen.style.display = 'flex';
    appContent.style.display = 'none';
}

function hideLoading() {
    loadingScreen.style.display = 'none';
    appContent.style.display = 'block';
}

// Show loading when page loads
showLoading();



// Logout function
logoutButton.addEventListener('click', async () => {
    try {
        // Special logout for test user
        if (currentUser && currentUser.uid === 'test-user-id') {
            localStorage.removeItem('testUser');
            localStorage.removeItem('testUserEmail');
            window.location.href = 'login.html';
            return;
        }
        
        await auth.signOut();
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Logout error:', error);
    }
});



// Load project settings from Firestore
function loadProjectSettings() {
    if (!currentUser) return;

    // Use localStorage for test user
    if (currentUser.uid === 'test-user-id') {
        const savedTarget = localStorage.getItem('projectTargetAmount');
        const savedStats = localStorage.getItem('showDetailedStats');
        
        if (savedTarget) {
            TARGET_AMOUNT = parseFloat(savedTarget);
        }
        if (savedStats !== null) {
            SHOW_DETAILED_STATS = savedStats === 'true';
        }
        
        updateSummary();
        updateStatsVisibility();
        return;
    }

    // Load project general settings from Firestore
    db.collection("project_settings").doc("global").get()
        .then((doc) => {
            if (doc.exists) {
                const data = doc.data();
                if (data.targetAmount) {
                    TARGET_AMOUNT = data.targetAmount;
                }
                if (data.showDetailedStats !== undefined) {
                    SHOW_DETAILED_STATS = data.showDetailedStats;
                }
            }
            updateSummary();
            updateStatsVisibility();
        })
        .catch((error) => {
            console.error("Error loading project settings: ", error);
            updateSummary(); // Continue with default value
            updateStatsVisibility();
        });
}

// Fetch data from database and listen for updates
function loadTransactions() {
    if (!currentUser) return;

    // Use localStorage for test user
    if (currentUser.uid === 'test-user-id') {
        loadTestTransactions();
        return;
    }

    db.collection("transactions")
        // .where("userEmail", "==", currentUser.email) // Remove this line to fetch all transactions
        .onSnapshot((snapshot) => {
            transactionList.innerHTML = ''; // Clear list
            totalSavings = 0; // Reset total savings

            // Convert data to array and sort
            const transactions = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                transactions.push({
                    id: doc.id,
                    ...data
                });
                totalSavings += data.amount; // Add each transaction to total
            });

            // Sort by timestamp (newest first)
            transactions.sort((a, b) => {
                if (!a.timestamp || !b.timestamp) return 0;
                return b.timestamp.toDate() - a.timestamp.toDate();
            });

            // Show last 10 transactions
            const recentTransactions = transactions.slice(0, 10);
            recentTransactions.forEach((transaction) => {
                const listItem = document.createElement('li');
                const date = transaction.timestamp ? formatDate(new Date(transaction.timestamp.toDate())) : 'No date';
                
                listItem.innerHTML = `
                    <div class="transaction-info">
                        <div class="transaction-amount">+${transaction.amount.toLocaleString('tr-TR')} TL</div>
                        <div class="transaction-date">${date}</div>
                        <div class="transaction-description">${transaction.description || 'No description'}</div>
                    </div>
                `;
                
                transactionList.appendChild(listItem);
            });

            // If no transactions, show empty state message
            if (transactions.length === 0) {
                transactionList.innerHTML = `
                    <li style="text-align: center; padding: 40px 20px; color: #cccccc; font-style: italic;">
                        <div style="font-size: 48px; margin-bottom: 15px;">💰</div>
                        <div style="font-size: 18px; margin-bottom: 10px;">No savings yet</div>
                        <div style="font-size: 14px;">Start by adding your first saving!</div>
                    </li>
                `;
            }
            
            updateSummary(); // Update summary
            hideLoading(); // Hide loading
        }, (error) => {
            console.error("Error loading data: ", error);
            hideLoading(); // Hide loading even on error
        });
}

// Load data from localStorage for test user
function loadTestTransactions() {
    const transactions = JSON.parse(localStorage.getItem('testTransactions') || '[]');
    transactionList.innerHTML = '';
    totalSavings = 0;

    // Get last 10 transactions
    const recentTransactions = transactions.slice(0, 10);
    
    recentTransactions.forEach((transaction) => {
        totalSavings += transaction.amount;
        
        const listItem = document.createElement('li');
        const date = formatDate(new Date(transaction.timestamp));
        
        listItem.innerHTML = `
            <div class="transaction-info">
                <div class="transaction-amount">+${transaction.amount.toLocaleString('tr-TR')} TL</div>
                <div class="transaction-date">${date}</div>
                <div class="transaction-description">${transaction.description || 'No description'}</div>
            </div>
        `;
        
        transactionList.appendChild(listItem);
    });

    // If no transactions, show empty state message
    if (transactions.length === 0) {
        transactionList.innerHTML = `
            <li style="text-align: center; padding: 40px 20px; color: #cccccc; font-style: italic;">
                <div style="font-size: 48px; margin-bottom: 15px;">💰</div>
                <div style="font-size: 18px; margin-bottom: 10px;">No savings yet</div>
                <div style="font-size: 14px;">Start by adding your first saving!</div>
            </li>
        `;
    }

    updateSummary();
    hideLoading(); // Hide loading
}

// Event listeners for quick-amount-btn
const quickAmountButtons = document.querySelectorAll('.quick-amount-btn');
quickAmountButtons.forEach(btn => {
    btn.addEventListener('click', function() {
        const value = this.getAttribute('data-amount');
        amountInput.value = value;
        amountInput.focus();
        updateAmountView();
    });
});

// Listen for add button click
addAmountButton.addEventListener('click', async () => {
    if (!currentUser) {
        alert('Please log in first.');
        return;
    }

    const amount = parseFloat(amountInput.value);
    const description = descriptionInput.value.trim() || 'No description';

    if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount.');
        return;
    }

    try {
        addAmountButton.disabled = true;
        addAmountButton.textContent = 'Adding...';

        // Use localStorage for test user
        if (currentUser.uid === 'test-user-id') {
            const transactions = JSON.parse(localStorage.getItem('testTransactions') || '[]');
            const newTransaction = {
                amount: amount,
                description: description,
                timestamp: new Date().toISOString()
            };
            transactions.unshift(newTransaction);
            localStorage.setItem('testTransactions', JSON.stringify(transactions));
            
            // Update UI
            loadTestTransactions();
        } else {
            // Add new transaction to Firestore
            await db.collection("transactions").add({
                amount: amount,
                description: description,
                userId: currentUser.uid,
                userEmail: currentUser.email,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        }

        amountInput.value = ''; // Clear input
        descriptionInput.value = ''; // Clear description input
        console.log("Transaction added successfully!");
        
    } catch (error) {
        console.error("Error adding transaction: ", error);
        alert('Error adding transaction.');
    } finally {
        addAmountButton.disabled = false;
        addAmountButton.textContent = 'Add';
    }
});

// Add on Enter key
amountInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !addAmountButton.disabled) {
        addAmountButton.click();
    }
});

descriptionInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !addAmountButton.disabled) {
        addAmountButton.click();
    }
});



// Date formatting function
function formatDate(date) {
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.ceil(diffTime / (1000 * 60));

    if (diffMinutes < 1) {
        return 'Just now';
    } else if (diffMinutes < 60) {
        return `${diffMinutes} minutes ago`;
    } else if (diffHours < 24) {
        return `${diffHours} hours ago`;
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else {
        return date.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }
}

// Update target amount
function updateTargetAmount(newTarget) {
    TARGET_AMOUNT = newTarget;
    
    if (currentUser.uid === 'test-user-id') {
        // Save to localStorage for test user
        localStorage.setItem('projectTargetAmount', newTarget.toString());
    } else {
        // Save to Firestore as project general setting
        db.collection("project_settings").doc("global").set({
            targetAmount: newTarget,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }).catch((error) => {
            console.error("Error updating target amount: ", error);
        });
    }
    
    updateSummary();
}

// Update stats visibility
function updateStatsVisibility() {
    const totalSavingsCard = document.getElementById('totalSavingsCard');
    const remainingAmountCard = document.getElementById('remainingAmountCard');
    
    if (SHOW_DETAILED_STATS) {
        totalSavingsCard.style.display = 'block';
        remainingAmountCard.style.display = 'block';
    } else {
        totalSavingsCard.style.display = 'none';
        remainingAmountCard.style.display = 'none';
    }
}

// Function to update summary
function updateSummary() {
    totalSavingsSpan.textContent = totalSavings.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' TL';
    const remaining = TARGET_AMOUNT - totalSavings;
    remainingAmountSpan.textContent = (remaining > 0 ? remaining.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) : '0,00') + ' TL';
    targetAmountSpan.textContent = TARGET_AMOUNT.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' TL';

    const percentage = (totalSavings / TARGET_AMOUNT) * 100;
    percentageAchievedSpan.textContent = percentage.toFixed(3) + '%';
    
    // Update progress bar
    const clampedPercentage = Math.min(percentage, 100);
    progressFill.style.width = clampedPercentage + '%';
}

function updateAmountView() {
    const val = amountInput.value;
    const num = parseFloat(val);
    if (!val || isNaN(num) || num <= 0) {
        amountInput.nextElementSibling.textContent = ''; // Find amountView and clear it
    } else {
        amountInput.nextElementSibling.textContent = num.toLocaleString('tr-TR', {minimumFractionDigits: 2}) + ' TL';
    }
}

document.addEventListener('DOMContentLoaded', updateAmountView);