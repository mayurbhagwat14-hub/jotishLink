import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import store, { persistor } from './store/store'
import { injectStore } from './api/axios'
import './index.css'
import App from './App.jsx'
import SplashScreen from './components/SplashScreen.jsx'

injectStore(store);

// Register Firebase Messaging Service Worker early for reliable push notifications
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' })
    .then((reg) => console.log('Firebase messaging SW registered (main.jsx):', reg.scope))
    .catch((err) => console.warn('Firebase messaging SW registration failed:', err));
}

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <PersistGate loading={<SplashScreen />} persistor={persistor}>
      <App />
    </PersistGate>
  </Provider>
)
