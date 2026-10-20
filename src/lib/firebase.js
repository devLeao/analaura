import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Configuração do app Web do Firebase. Essas chaves não são secretas:
// quem protege os dados são as regras do Firestore (firestore.rules).
const firebaseConfig = {
  apiKey: 'AIzaSyBqLC2vWgOghUaVaxUBlIlTlExSvt9ZC0A',
  authDomain: 'laura-celvio.firebaseapp.com',
  projectId: 'laura-celvio',
  storageBucket: 'laura-celvio.firebasestorage.app',
  messagingSenderId: '688836645323',
  appId: '1:688836645323:web:12c0f376062415e903a64e',
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const fs = getFirestore(app)

export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

/** Administrador principal (desenvolvedor). Outros admins ficam na coleção `admins`. */
export const SUPER_ADMIN = 'leandrofls16@gmail.com'
