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

// DOM elementlerini seç
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const loginButton = document.getElementById('loginButton');
const loginError = document.getElementById('loginError');

// Sayfa yüklendiğinde kullanıcı durumunu kontrol et
auth.onAuthStateChanged((user) => {
    if (user) {
        // Kullanıcı zaten giriş yapmış, ana sayfaya yönlendir
        window.location.href = 'index.html';
    }
});

// Login fonksiyonu
loginButton.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        showError('Please enter email and password.');
        return;
    }

    // Test için admin/admin girişi
    if (email === 'admin' && password === 'admin') {
        // Test kullanıcısı için localStorage'a giriş durumu kaydet
        localStorage.setItem('testUser', 'true');
        localStorage.setItem('testUserEmail', 'admin@test.com');
        window.location.href = 'index.html';
        return;
    }

    try {
        loginButton.disabled = true;
        loginButton.textContent = 'Logging in...';
        
        // Firebase Authentication ile giriş yap
        await auth.signInWithEmailAndPassword(email, password);
        
        // Başarılı giriş - ana sayfaya yönlendir
        window.location.href = 'index.html';
        
    } catch (error) {
        console.error('Login error:', error);
        
        switch (error.code) {
            case 'auth/user-not-found':
                showError('User not found.');
                break;
            case 'auth/wrong-password':
                showError('Wrong password.');
                break;
            case 'auth/invalid-email':
                showError('Invalid email address.');
                break;
            case 'auth/too-many-requests':
                showError('Too many failed attempts. Please try again later.');
                break;
            default:
                showError('An error occurred during login.');
        }
    } finally {
        loginButton.disabled = false;
        loginButton.textContent = 'Login';
    }
});

// Enter tuşu ile giriş
passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        loginButton.click();
    }
});

// Hata mesajı gösterme fonksiyonu
function showError(message) {
    loginError.textContent = message;
} 