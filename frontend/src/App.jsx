import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js'
import { Bar, Line } from 'react-chartjs-2'
import './App.css'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend)

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const demoProducts = [
  {
    id: 'demo-1',
    _id: 'demo-1',
    name: 'AeroFit Smart Watch',
    category: 'Wearables',
    price: 3499,
    costPrice: 2100,
    stock: 8,
    unitsSold: 82,
    status: 'active',
    description: 'A sleek fitness smartwatch with heart-rate tracking, water resistance and long battery life.',
    seoTags: ['smart watch', 'fitness tracker', 'wearables'],
    marketingCaptions: ['Track better. Train smarter. Sell faster.'],
  },
  {
    id: 'demo-2',
    _id: 'demo-2',
    name: 'LumaDesk LED Lamp',
    category: 'Home Office',
    price: 1599,
    costPrice: 760,
    stock: 3,
    unitsSold: 44,
    status: 'active',
    description: 'Adjustable LED desk lamp with warm, cool and reading modes for compact workspaces.',
    seoTags: ['desk lamp', 'led lamp', 'home office'],
    marketingCaptions: ['Make late-night work feel lighter.'],
  },
  {
    id: 'demo-3',
    _id: 'demo-3',
    name: 'UrbanPack Travel Bag',
    category: 'Accessories',
    price: 2299,
    costPrice: 1250,
    stock: 16,
    unitsSold: 63,
    status: 'active',
    description: 'Durable travel backpack with laptop storage, anti-theft zippers and weekend capacity.',
    seoTags: ['travel bag', 'laptop backpack', 'anti theft bag'],
    marketingCaptions: ['Built for commutes, classes and quick trips.'],
  },
]

const emptyProduct = {
  name: '',
  category: '',
  price: '',
  costPrice: '',
  stock: '',
  unitsSold: '',
  description: '',
  seoTags: '',
  marketingCaptions: '',
  status: 'active',
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('smartstore_token') || '')
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('smartstore_user') || 'null'))
  const [activeView, setActiveView] = useState('dashboard')
  const [products, setProducts] = useState(demoProducts)
  const [analytics, setAnalytics] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const [authMode, setAuthMode] = useState('login')
  const [authForm, setAuthForm] = useState({
    name: '',
    storeName: '',
    email: '',
    password: '',
  })
  const [productForm, setProductForm] = useState(emptyProduct)
  const [editingProduct, setEditingProduct] = useState(null)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState('demo-1')
  const [aiContent, setAiContent] = useState(null)
  const [loading, setLoading] = useState('')
  const [notice, setNotice] = useState('')

  const api = useMemo(() => {
    const client = axios.create({ baseURL: API_URL })
    client.interceptors.request.use((config) => {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })
    return client
  }, [token])

  const selectedProduct = products.find((product) => product._id === selectedProductId || product.id === selectedProductId) || products[0]

  const computedAnalytics = useMemo(() => {
    const totalRevenue = products.reduce((sum, product) => sum + Number(product.price) * Number(product.unitsSold), 0)
    const totalProfit = products.reduce(
      (sum, product) => sum + (Number(product.price) - Number(product.costPrice || 0)) * Number(product.unitsSold),
      0,
    )
    const lowStockProducts = products.filter((product) => Number(product.stock) <= 5)
    const topProducts = [...products]
      .sort((a, b) => Number(b.price) * Number(b.unitsSold) - Number(a.price) * Number(a.unitsSold))
      .slice(0, 5)
      .map((product) => ({
        id: product._id || product.id,
        name: product.name,
        category: product.category,
        revenue: Number(product.price) * Number(product.unitsSold),
        unitsSold: Number(product.unitsSold),
        stock: Number(product.stock),
      }))
    const monthlyRevenue = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, index) => ({
      month,
      revenue: Math.round(totalRevenue * (0.1 + index * 0.028)),
    }))
    const categoryRevenue = products.reduce((acc, product) => {
      acc[product.category] = (acc[product.category] || 0) + Number(product.price) * Number(product.unitsSold)
      return acc
    }, {})

    return {
      metrics: {
        totalRevenue,
        totalProfit,
        totalProducts: products.length,
        totalStock: products.reduce((sum, product) => sum + Number(product.stock), 0),
        lowStockCount: lowStockProducts.length,
      },
      monthlyRevenue,
      topProducts,
      categoryRevenue: Object.entries(categoryRevenue).map(([category, revenue]) => ({ category, revenue })),
      lowStockProducts,
    }
  }, [products])

  const dashboard = analytics || computedAnalytics

  useEffect(() => {
    if (!token) return
    loadWorkspace()
  }, [token])

  const showNotice = (message) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 3500)
  }

  const loadWorkspace = async () => {
    try {
      setLoading('workspace')
      const [productsResponse, analyticsResponse, suggestionsResponse] = await Promise.all([
        api.get('/products'),
        api.get('/analytics/dashboard'),
        api.get('/ai/sales-suggestions'),
      ])
      setProducts(productsResponse.data.products)
      setAnalytics(analyticsResponse.data)
      setSuggestions(suggestionsResponse.data.suggestions)
      setSelectedProductId(productsResponse.data.products[0]?._id || '')
    } catch (error) {
      showNotice(error.response?.data?.message || 'Using demo data until backend and MongoDB are running.')
    } finally {
      setLoading('')
    }
  }

  const handleAuth = async (event) => {
    event.preventDefault()
    try {
      setLoading('auth')
      const endpoint = authMode === 'login' ? '/auth/login' : '/auth/signup'
      const response = await api.post(endpoint, authForm)
      localStorage.setItem('smartstore_token', response.data.token)
      localStorage.setItem('smartstore_user', JSON.stringify(response.data.user))
      setToken(response.data.token)
      setUser(response.data.user)
      showNotice(`Welcome to ${response.data.user.storeName}`)
    } catch (error) {
      showNotice(error.response?.data?.message || 'Start backend and MongoDB, or use demo workspace.')
    } finally {
      setLoading('')
    }
  }

  const startDemo = () => {
    const demoUser = { name: 'Demo Owner', storeName: 'SmartStore Demo', email: 'demo@smartstore.ai' }
    localStorage.setItem('smartstore_user', JSON.stringify(demoUser))
    setUser(demoUser)
    setToken('')
    setActiveView('dashboard')
    showNotice('Demo workspace loaded. Connect backend for database persistence.')
  }

  const logout = () => {
    localStorage.removeItem('smartstore_token')
    localStorage.removeItem('smartstore_user')
    setToken('')
    setUser(null)
    setProducts(demoProducts)
    setAnalytics(null)
    setSuggestions([])
    setAiContent(null)
  }

  const openProductForm = (product = null) => {
    setEditingProduct(product)
    setIsProductModalOpen(true)
    setProductForm(
      product
        ? {
            ...product,
            seoTags: product.seoTags?.join(', ') || '',
            marketingCaptions: product.marketingCaptions?.join('\n') || '',
          }
        : emptyProduct,
    )
  }

  const saveProduct = async (event) => {
    event.preventDefault()
    const payload = {
      ...productForm,
      price: Number(productForm.price),
      costPrice: Number(productForm.costPrice || 0),
      stock: Number(productForm.stock || 0),
      unitsSold: Number(productForm.unitsSold || 0),
      seoTags: String(productForm.seoTags || '')
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      marketingCaptions: String(productForm.marketingCaptions || '')
        .split('\n')
        .map((caption) => caption.trim())
        .filter(Boolean),
    }

    try {
      setLoading('product')
      if (token) {
        const response = editingProduct
          ? await api.put(`/products/${editingProduct._id}`, payload)
          : await api.post('/products', payload)
        const saved = response.data.product
        setProducts((current) =>
          editingProduct ? current.map((item) => (item._id === saved._id ? saved : item)) : [saved, ...current],
        )
      } else {
        const saved = { ...payload, _id: editingProduct?._id || crypto.randomUUID(), id: editingProduct?.id || crypto.randomUUID() }
        setProducts((current) =>
          editingProduct ? current.map((item) => (item._id === saved._id ? saved : item)) : [saved, ...current],
        )
      }
      setEditingProduct(null)
      setIsProductModalOpen(false)
      setProductForm(emptyProduct)
      setAnalytics(null)
      showNotice('Product saved')
    } catch (error) {
      showNotice(error.response?.data?.message || 'Product could not be saved')
    } finally {
      setLoading('')
    }
  }

  const deleteProduct = async (product) => {
    try {
      setLoading('delete')
      if (token) {
        await api.delete(`/products/${product._id}`)
      }
      setProducts((current) => current.filter((item) => item._id !== product._id))
      setAnalytics(null)
      showNotice('Product deleted')
    } catch (error) {
      showNotice(error.response?.data?.message || 'Product could not be deleted')
    } finally {
      setLoading('')
    }
  }

  const seedProducts = async () => {
    try {
      setLoading('seed')
      if (token) {
        const response = await api.post('/products/seed')
        setProducts(response.data.products)
      } else {
        setProducts(demoProducts)
      }
      setAnalytics(null)
      showNotice('Sample products loaded')
    } catch (error) {
      showNotice(error.response?.data?.message || 'Seed products could not be loaded')
    } finally {
      setLoading('')
    }
  }

  const generateContent = async () => {
    if (!selectedProduct) return

    try {
      setLoading('ai')
      if (token && selectedProduct._id) {
        const response = await api.post(`/ai/products/${selectedProduct._id}/content`)
        setAiContent(response.data.content)
        setProducts((current) => current.map((product) => (product._id === response.data.product._id ? response.data.product : product)))
      } else {
        const content = {
          description: `${selectedProduct.name} is a standout ${selectedProduct.category} product for shoppers who care about quality, value and speed. Highlight its practical benefits, clear pricing and limited stock to improve conversions across your store.`,
          seoTags: [selectedProduct.name, selectedProduct.category, 'online shopping', 'best seller', 'smart deals'],
          marketingCaptions: [
            `Make ${selectedProduct.name} your next best-selling campaign.`,
            `Fresh stock, strong value and a smarter reason to buy.`,
            `Bring ${selectedProduct.category} buyers closer to checkout.`,
          ],
          notes: 'Demo Gemini-style output. Add GEMINI_API_KEY for live model generation.',
        }
        setAiContent(content)
      }
      showNotice('AI content generated')
    } catch (error) {
      showNotice(error.response?.data?.message || 'AI generation failed')
    } finally {
      setLoading('')
    }
  }

  const refreshSuggestions = async () => {
    if (!token) {
      setSuggestions(
        computedAnalytics.topProducts.map((product) => ({
          title: product.stock <= 5 ? `Restock ${product.name}` : `Promote ${product.name}`,
          reason: product.stock <= 5 ? 'Low stock can block sales momentum.' : 'Product has enough sales signal for a focused campaign.',
          action: product.stock <= 5 ? 'Reorder inventory and show low-stock urgency.' : 'Test a bundle, caption and 5% price experiment.',
          priority: product.stock <= 5 ? 'high' : 'medium',
        })),
      )
      return
    }

    try {
      setLoading('suggestions')
      const response = await api.get('/ai/sales-suggestions')
      setSuggestions(response.data.suggestions)
    } catch (error) {
      showNotice(error.response?.data?.message || 'Suggestions could not be refreshed')
    } finally {
      setLoading('')
    }
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <section className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 items-center gap-10 px-6 py-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Gemini powered commerce admin</p>
            <h1 className="max-w-3xl text-4xl font-black leading-tight text-white sm:text-6xl">
              SmartStore AI
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              Manage products, generate descriptions, create SEO tags, monitor revenue and receive AI sales suggestions from one admin workspace.
            </p>
            <div className="mt-8 grid max-w-2xl grid-cols-3 gap-3">
              {['JWT Auth', 'Gemini AI', 'Chart.js'].map((item) => (
                <div key={item} className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleAuth} className="rounded-xl border border-white/10 bg-white p-6 text-slate-950 shadow-2xl">
            <div className="mb-6 flex rounded-lg bg-slate-100 p-1">
              {['login', 'signup'].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setAuthMode(mode)}
                  className={`flex-1 rounded-md px-4 py-2 text-sm font-bold capitalize ${
                    authMode === mode ? 'bg-slate-950 text-white' : 'text-slate-600'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {authMode === 'signup' && (
              <>
                <label className="form-label">
                  Owner name
                  <input className="form-input" value={authForm.name} onChange={(event) => setAuthForm({ ...authForm, name: event.target.value })} />
                </label>
                <label className="form-label">
                  Store name
                  <input className="form-input" value={authForm.storeName} onChange={(event) => setAuthForm({ ...authForm, storeName: event.target.value })} />
                </label>
              </>
            )}

            <label className="form-label">
              Email
              <input className="form-input" type="email" value={authForm.email} onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })} />
            </label>
            <label className="form-label">
              Password
              <input className="form-input" type="password" value={authForm.password} onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })} />
            </label>

            <button className="primary-button mt-3 w-full" disabled={loading === 'auth'}>
              {loading === 'auth' ? 'Please wait...' : authMode === 'login' ? 'Login' : 'Create account'}
            </button>
            <button type="button" className="secondary-button mt-3 w-full" onClick={startDemo}>
              Open demo workspace
            </button>
          </form>
        </section>
        {notice && <div className="toast">{notice}</div>}
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 border-r border-slate-200 bg-white px-5 py-6 lg:block">
        <div className="mb-8">
          <p className="text-sm font-black uppercase tracking-[0.24em] text-cyan-700">SmartStore</p>
          <h2 className="mt-2 text-2xl font-black">{user.storeName}</h2>
        </div>
        <nav className="space-y-2">
          {[
            ['dashboard', 'Dashboard'],
            ['products', 'Products'],
            ['ai', 'AI Studio'],
            ['insights', 'Sales Insights'],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveView(key)}
              className={`w-full rounded-lg px-4 py-3 text-left text-sm font-bold ${
                activeView === key ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </aside>

      <section className="lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-500">Welcome, {user.name}</p>
              <h1 className="text-2xl font-black">AI E-commerce Admin Assistant</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="secondary-button" onClick={loadWorkspace} disabled={!token || loading === 'workspace'}>
                Sync
              </button>
              <button className="primary-button" onClick={() => openProductForm()}>
                Add product
              </button>
              <button className="danger-button" onClick={logout}>
                Logout
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-5 py-6">
          <div className="mb-5 grid grid-cols-2 gap-2 lg:hidden">
            {[
              ['dashboard', 'Dashboard'],
              ['products', 'Products'],
              ['ai', 'AI Studio'],
              ['insights', 'Insights'],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveView(key)}
                className={`rounded-lg px-3 py-2 text-sm font-bold ${activeView === key ? 'bg-slate-950 text-white' : 'bg-white text-slate-600'}`}
              >
                {label}
              </button>
            ))}
          </div>

          {activeView === 'dashboard' && <Dashboard dashboard={dashboard} />}
          {activeView === 'products' && (
            <Products products={products} onEdit={openProductForm} onDelete={deleteProduct} onSeed={seedProducts} loading={loading} />
          )}
          {activeView === 'ai' && (
            <AiStudio
              products={products}
              selectedProductId={selectedProductId}
              setSelectedProductId={setSelectedProductId}
              selectedProduct={selectedProduct}
              generateContent={generateContent}
              aiContent={aiContent}
              loading={loading}
            />
          )}
          {activeView === 'insights' && (
            <Insights
              suggestions={suggestions}
              refreshSuggestions={refreshSuggestions}
              dashboard={dashboard}
              loading={loading}
            />
          )}
        </div>
      </section>

      {isProductModalOpen ? (
        <ProductModal
          productForm={productForm}
          setProductForm={setProductForm}
          saveProduct={saveProduct}
          close={() => {
            setEditingProduct(null)
            setIsProductModalOpen(false)
            setProductForm(emptyProduct)
          }}
          editingProduct={editingProduct}
          loading={loading}
        />
      ) : null}

      {notice && <div className="toast">{notice}</div>}
    </main>
  )
}

function Dashboard({ dashboard }) {
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
  }
  const monthlyChart = {
    labels: dashboard.monthlyRevenue.map((item) => item.month),
    datasets: [
      {
        data: dashboard.monthlyRevenue.map((item) => item.revenue),
        borderColor: '#0891b2',
        backgroundColor: 'rgba(8, 145, 178, 0.18)',
        tension: 0.35,
        fill: true,
      },
    ],
  }
  const categoryChart = {
    labels: dashboard.categoryRevenue.map((item) => item.category),
    datasets: [
      {
        data: dashboard.categoryRevenue.map((item) => item.revenue),
        backgroundColor: ['#0f172a', '#0891b2', '#16a34a', '#f59e0b', '#dc2626'],
        borderRadius: 6,
      },
    ],
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Metric title="Revenue" value={`Rs ${Math.round(dashboard.metrics.totalRevenue).toLocaleString()}`} />
        <Metric title="Profit" value={`Rs ${Math.round(dashboard.metrics.totalProfit).toLocaleString()}`} />
        <Metric title="Products" value={dashboard.metrics.totalProducts} />
        <Metric title="Stock units" value={dashboard.metrics.totalStock} />
        <Metric title="Low stock" value={dashboard.metrics.lowStockCount} tone="danger" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="panel">
          <div className="panel-heading">
            <h2>Revenue analytics</h2>
            <span>Monthly sales trend</span>
          </div>
          <div className="h-80">
            <Line data={monthlyChart} options={chartOptions} />
          </div>
        </div>
        <div className="panel">
          <div className="panel-heading">
            <h2>Category revenue</h2>
            <span>Product mix</span>
          </div>
          <div className="h-80">
            <Bar data={categoryChart} options={chartOptions} />
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>Top products</h2>
          <span>Sorted by revenue</span>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Revenue</th>
                <th>Units sold</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.topProducts.map((product) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>{product.category}</td>
                  <td>Rs {Math.round(product.revenue).toLocaleString()}</td>
                  <td>{product.unitsSold}</td>
                  <td>{product.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function Metric({ title, value, tone = 'default' }) {
  return (
    <div className={`metric-card ${tone === 'danger' ? 'border-red-200 bg-red-50' : ''}`}>
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  )
}

function Products({ products, onEdit, onDelete, onSeed, loading }) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>Product management</h2>
          <span className="block text-left">Add, edit, delete and prepare products for AI generation</span>
        </div>
        <button className="secondary-button" onClick={onSeed} disabled={loading === 'seed' || products.length > 0}>
          {loading === 'seed' ? 'Loading...' : 'Load sample data'}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Sold</th>
              <th>Content</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product._id || product.id}>
                <td className="font-bold">{product.name}</td>
                <td>{product.category}</td>
                <td>Rs {Number(product.price).toLocaleString()}</td>
                <td>
                  <span className={Number(product.stock) <= 5 ? 'status-danger' : 'status-ok'}>{product.stock}</span>
                </td>
                <td>{product.unitsSold}</td>
                <td>{product.description ? 'Generated' : 'Pending'}</td>
                <td>
                  <div className="flex gap-2">
                    <button className="table-button" onClick={() => onEdit(product)}>Edit</button>
                    <button className="table-button danger" onClick={() => onDelete(product)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function AiStudio({ products, selectedProductId, setSelectedProductId, selectedProduct, generateContent, aiContent, loading }) {
  return (
    <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
      <div className="panel">
        <div className="panel-heading">
          <h2>AI content engine</h2>
          <span>Gemini descriptions, tags and captions</span>
        </div>
        <label className="form-label">
          Select product
          <select className="form-input" value={selectedProductId} onChange={(event) => setSelectedProductId(event.target.value)}>
            {products.map((product) => (
              <option key={product._id || product.id} value={product._id || product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </label>
        {selectedProduct && (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="font-black">{selectedProduct.name}</h3>
            <p className="mt-2 text-sm text-slate-600">
              {selectedProduct.category} · Rs {Number(selectedProduct.price).toLocaleString()} · {selectedProduct.stock} in stock
            </p>
          </div>
        )}
        <button className="primary-button mt-5 w-full" onClick={generateContent} disabled={loading === 'ai'}>
          {loading === 'ai' ? 'Generating...' : 'Generate with Gemini'}
        </button>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <h2>Generated output</h2>
          <span>Description, SEO and marketing copy</span>
        </div>
        {(aiContent || selectedProduct) && (
          <div className="space-y-5">
            <div>
              <h3 className="section-label">Description</h3>
              <p className="rounded-lg bg-slate-50 p-4 leading-7 text-slate-700">
                {aiContent?.description || selectedProduct?.description || 'Generate content to fill this product description.'}
              </p>
            </div>
            <div>
              <h3 className="section-label">SEO tags</h3>
              <div className="flex flex-wrap gap-2">
                {(aiContent?.seoTags || selectedProduct?.seoTags || []).map((tag) => (
                  <span className="tag" key={tag}>{tag}</span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="section-label">Marketing captions</h3>
              <div className="space-y-2">
                {(aiContent?.marketingCaptions || selectedProduct?.marketingCaptions || []).map((caption) => (
                  <p className="rounded-lg border border-slate-200 p-3 text-sm text-slate-700" key={caption}>{caption}</p>
                ))}
              </div>
            </div>
            {aiContent?.notes && <p className="rounded-lg bg-cyan-50 p-3 text-sm font-semibold text-cyan-900">{aiContent.notes}</p>}
          </div>
        )}
      </div>
    </section>
  )
}

function Insights({ suggestions, refreshSuggestions, dashboard, loading }) {
  return (
    <section className="space-y-5">
      <div className="panel">
        <div className="panel-heading">
          <h2>AI sales suggestions</h2>
          <span>Pricing, inventory and promotion recommendations</span>
        </div>
        <button className="primary-button" onClick={refreshSuggestions} disabled={loading === 'suggestions'}>
          {loading === 'suggestions' ? 'Refreshing...' : 'Refresh suggestions'}
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {suggestions.map((suggestion, index) => (
          <article className="panel" key={`${suggestion.title}-${index}`}>
            <span className={`priority ${suggestion.priority}`}>{suggestion.priority}</span>
            <h3 className="mt-4 text-xl font-black">{suggestion.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">{suggestion.reason}</p>
            <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm font-semibold text-slate-700">{suggestion.action}</p>
          </article>
        ))}
      </div>

      <div className="panel">
        <div className="panel-heading">
          <h2>Inventory alerts</h2>
          <span>Low stock detection</span>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {dashboard.lowStockProducts.length ? (
            dashboard.lowStockProducts.map((product) => (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4" key={product.id || product._id}>
                <strong>{product.name}</strong>
                <p className="mt-1 text-sm text-red-700">Only {product.stock} units left. Restock or pause ads soon.</p>
              </div>
            ))
          ) : (
            <p className="text-sm font-semibold text-slate-600">No low-stock products right now.</p>
          )}
        </div>
      </div>
    </section>
  )
}

function ProductModal({ productForm, setProductForm, saveProduct, close, editingProduct, loading }) {
  const update = (key, value) => setProductForm({ ...productForm, [key]: value })

  return (
    <div className="fixed inset-0 z-30 grid place-items-center bg-slate-950/60 px-4 py-8">
      <form onSubmit={saveProduct} className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black">{editingProduct ? 'Edit product' : 'Add product'}</h2>
            <p className="text-sm text-slate-500">Fill sales data so dashboard and Gemini suggestions are useful.</p>
          </div>
          <button type="button" className="table-button" onClick={close}>Close</button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="form-label">
            Product name
            <input className="form-input" value={productForm.name} onChange={(event) => update('name', event.target.value)} required />
          </label>
          <label className="form-label">
            Category
            <input className="form-input" value={productForm.category} onChange={(event) => update('category', event.target.value)} required />
          </label>
          <label className="form-label">
            Price
            <input className="form-input" type="number" value={productForm.price} onChange={(event) => update('price', event.target.value)} required />
          </label>
          <label className="form-label">
            Cost price
            <input className="form-input" type="number" value={productForm.costPrice} onChange={(event) => update('costPrice', event.target.value)} />
          </label>
          <label className="form-label">
            Stock
            <input className="form-input" type="number" value={productForm.stock} onChange={(event) => update('stock', event.target.value)} />
          </label>
          <label className="form-label">
            Units sold
            <input className="form-input" type="number" value={productForm.unitsSold} onChange={(event) => update('unitsSold', event.target.value)} />
          </label>
        </div>

        <label className="form-label mt-4">
          Description
          <textarea className="form-input min-h-28" value={productForm.description} onChange={(event) => update('description', event.target.value)} />
        </label>
        <label className="form-label">
          SEO tags
          <input className="form-input" value={productForm.seoTags} onChange={(event) => update('seoTags', event.target.value)} placeholder="tag one, tag two" />
        </label>
        <label className="form-label">
          Marketing captions
          <textarea className="form-input min-h-24" value={productForm.marketingCaptions} onChange={(event) => update('marketingCaptions', event.target.value)} />
        </label>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" className="secondary-button" onClick={close}>Cancel</button>
          <button className="primary-button" disabled={loading === 'product'}>
            {loading === 'product' ? 'Saving...' : 'Save product'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default App
