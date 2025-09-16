'use client'

import { useState } from 'react'

export default function AdminPage() {
  const [caption, setCaption] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.p
