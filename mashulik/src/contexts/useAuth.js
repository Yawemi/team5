import { createContext, useContext, useEffect, useState } from "react"

import { getUserStatus, login, login_teacher_api, register, getProfile, logout } from "../endpoints/api"


import { useNavigate } from "react-router-dom"

const AuthContext = createContext();

export const AuthProvider = ({children}) => {
    const [user, setUser] = useState(null)
    const [isTeacher, setIsTeacher] = useState(false)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [loading, setLoading] = useState(true)
    const nav = useNavigate()

    const get_authenticated = async () => {
        try {
            const { authenticated, isTeacher } = await getUserStatus()
            setIsAuthenticated(authenticated)
            setIsTeacher(isTeacher)
        } catch {
            setIsAuthenticated(false)
            setIsTeacher(false)
        } finally {
            setLoading(false)
        }
    }

    const register_student = async (username, email, password, firstName, lastName) => {
        try{
            await register(username, email, password, firstName, lastName)
            alert('Успешная регистрация')
        } catch {
            alert('Ошибка регистрации')
        }
    }

    const login_student = async (username, password) => {
        const success = await login(username, password);
        if (success) {
            setIsAuthenticated(true)
            const me = await getProfile()
            setUser(me)
            nav('/student/dashboard') // ??
        } else {
            alert('Неверный логин или пароль')
        }
    }
    
    const login_teacher = async (code) => {
        const {success, isTeacher} = await login_teacher_api(code);
        if (success) {
            setIsAuthenticated(true)
            setIsTeacher(isTeacher)
            const me = await getProfile()
            setUser(me)
            nav('/teacher')
        } else {
            alert('Неверный код')
        }
    }

    const logout_all = async () => {
        await logout()
        setIsAuthenticated(false)
        setIsTeacher(false)
        setUser(null)
        nav('/login')
        }
    

    useEffect(() => {
    (async () => {
      try {
        const { authenticated, isTeacher } = await getUserStatus();
        setIsAuthenticated(authenticated)
        setIsTeacher(isTeacher)
        if (authenticated) {
          const me = await getProfile()
          setUser(me);
        }
      } catch {
        setIsAuthenticated(false)
        setIsTeacher(false)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

    return (
        <AuthContext.Provider value={{isAuthenticated, isTeacher, loading, login_student, login_teacher, register_student, user, logout_all}}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext);