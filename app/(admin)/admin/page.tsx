'use client'

import axios from 'axios'
import React, { useState } from 'react'

const page = () => {
    const [userName, setUserName] = useState('')
    const [password, setPassword] = useState('')
    

    const handleLogin = async () => {
        const response = await axios.post("/api/admin_login", {
            username: userName,
            password: password
        })
        console.log(response.data)
        if(response.data === true){
            window.location.href = "/admin/dashboard"
        }
    }
  return (
    <section className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-xl dark:bg-gray-800 dark:border dark:border-gray-700">
        <div className="text-center">
          <a
            href="#"
            className="text-3xl font-bold text-gray-900 dark:text-white"
          >
            NinjaText-AI Admin
          </a>
        </div>
        <div className="space-y-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Login
          </h1>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                placeholder="name@company.com"
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                placeholder="••••••••"
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 text-sm font-medium text-white bg-sky-600 rounded-lg hover:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-300 dark:bg-sky-500 dark:hover:bg-sky-600 dark:focus:ring-sky-800"
              onClick={handleLogin}
            >
              Login
            </button>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Don't have an account?{' '}
            <a
              href="/signup"
              className="font-medium text-sky-600 hover:underline dark:text-sky-500"
            >
              Sign up here
            </a>
          </p>
        </div>
      </div>
    </section>
  )
}

export default page
