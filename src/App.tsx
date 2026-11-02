import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'

import {
  LayoutDashboard,
  ArrowLeftRight,
  Target,
  BarChart3,
  Settings,
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Search,
  Bell,
  Plus,
  ChevronDown,
  CreditCard,
  ShoppingBag,
  Coffee,
  Briefcase,
  Menu,
  X,
  Trash2,
  Pencil,
  CalendarDays,
  Filter,
  RotateCcw,
  PiggyBank,
} from 'lucide-react'

import './App.css'
import Reports from './Reports'
import SettingsPage from './Settings'

// ======================================
// TIPOS
// ======================================

type TransactionType = 'income' | 'expense'
type FilterType = TransactionType | 'all'
type SortType = 'recent' | 'oldest' | 'highest' | 'lowest'

type Transaction = {
  id: string
  name: string
  category: string
  date: string
  amount: number
  type: TransactionType
}

type FinancialGoal = {
  id: string
  name: string
  target: number
  saved: number
}

// ======================================
// CONFIGURAÇÕES
// ======================================

const TRANSACTIONS_KEY = 'fintrack_transactions'
const GOALS_KEY = 'fintrack_goals'

const categories = [
  'Trabalho',
  'Alimentação',
  'Moradia',
  'Transporte',
  'Saúde',
  'Lazer',
  'Educação',
  'Investimentos',
  'Assinaturas',
  'Outros',
]

const money = (value: number): string =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)

function today(): string {
  const date = new Date()

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatDate(value: string): string {
  const [year, month, day] = value.split('-').map(Number)

  return new Date(year, month - 1, day).toLocaleDateString('pt-BR')
}

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false

  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)

  return (
    date.getFullYear() === year &&
    date.getMonth() + 1 === month &&
    date.getDate() === day
  )
}

function loadTransactions(): Transaction[] {
  try {
    const saved = localStorage.getItem(TRANSACTIONS_KEY)

    if (!saved) return []

    const parsed: unknown = JSON.parse(saved)

    if (!Array.isArray(parsed)) return []

    return parsed.filter((item): item is Transaction => (
      item !== null &&
      typeof item === 'object' &&
      typeof item.id === 'string' &&
      typeof item.name === 'string' &&
      typeof item.category === 'string' &&
      typeof item.date === 'string' &&
      validDate(item.date) &&
      typeof item.amount === 'number' &&
      Number.isFinite(item.amount) &&
      item.amount > 0 &&
      (item.type === 'income' || item.type === 'expense')
    ))
  } catch {
    return []
  }
}

function loadGoals(): FinancialGoal[] {
  try {
    const saved = localStorage.getItem(GOALS_KEY)

    if (!saved) return []

    const parsed: unknown = JSON.parse(saved)

    if (!Array.isArray(parsed)) return []

    return parsed.filter((item): item is FinancialGoal => (
      item !== null &&
      typeof item === 'object' &&
      typeof item.id === 'string' &&
      typeof item.name === 'string' &&
      typeof item.target === 'number' &&
      Number.isFinite(item.target) &&
      item.target > 0 &&
      typeof item.saved === 'number' &&
      Number.isFinite(item.saved) &&
      item.saved >= 0
    ))
  } catch {
    return []
  }
}

function categoryIcon(category: string) {
  switch (category) {
    case 'Trabalho':
      return Briefcase
    case 'Alimentação':
      return ShoppingBag
    case 'Assinaturas':
      return CreditCard
    case 'Lazer':
      return Coffee
    default:
      return Wallet
  }
}

// ======================================
// COMPONENTE PRINCIPAL
// ======================================

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // TRANSAÇÕES
  const [transactions, setTransactions] =
    useState<Transaction[]>(loadTransactions)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Outros')
  const [date, setDate] = useState(today)
  const [type, setType] = useState<TransactionType>('expense')

  // FILTROS
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterMonth, setFilterMonth] = useState('all')
  const [sortBy, setSortBy] = useState<SortType>('recent')

  // METAS FINANCEIRAS
  const [goals, setGoals] = useState<FinancialGoal[]>(loadGoals)

  const [goalModalOpen, setGoalModalOpen] = useState(false)
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null)

  const [goalName, setGoalName] = useState('')
  const [goalTarget, setGoalTarget] = useState('')
  const [goalSaved, setGoalSaved] = useState('')

  // DEPÓSITOS NAS METAS
  const [depositGoalId, setDepositGoalId] = useState<string | null>(null)
  const [depositAmount, setDepositAmount] = useState('')

  // ======================================
  // PERSISTÊNCIA
  // ======================================

  useEffect(() => {
    localStorage.setItem(
      TRANSACTIONS_KEY,
      JSON.stringify(transactions)
    )
  }, [transactions])

  useEffect(() => {
    localStorage.setItem(GOALS_KEY, JSON.stringify(goals))
  }, [goals])

  // ======================================
  // RESUMO FINANCEIRO
  // ======================================

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  const monthlyTransactions = transactions.filter((item) => {
    const [year, month] = item.date.split('-').map(Number)
    return year === currentYear && month === currentMonth
  })

  const totalIncome = transactions
    .filter((item) => item.type === 'income')
    .reduce((sum, item) => sum + item.amount, 0)

  const totalExpenses = transactions
    .filter((item) => item.type === 'expense')
    .reduce((sum, item) => sum + item.amount, 0)

  const balance = totalIncome - totalExpenses

  const monthlyIncome = monthlyTransactions
    .filter((item) => item.type === 'income')
    .reduce((sum, item) => sum + item.amount, 0)

  const monthlyExpenses = monthlyTransactions
    .filter((item) => item.type === 'expense')
    .reduce((sum, item) => sum + item.amount, 0)

  // ======================================
  // FILTROS
  // ======================================

  const availableMonths = Array.from(
    new Set(transactions.map((item) => item.date.slice(0, 7)))
  ).sort((a, b) => b.localeCompare(a))

  function monthLabel(value: string): string {
    const [year, month] = value.split('-').map(Number)

    return new Date(year, month - 1, 1).toLocaleDateString(
      'pt-BR',
      { month: 'long', year: 'numeric' }
    )
  }

  const filteredTransactions = transactions
    .filter((item) => {
      const matchesSearch =
        `${item.name} ${item.category}`
          .toLowerCase()
          .includes(search.toLowerCase().trim())

      const matchesType =
        filterType === 'all' || item.type === filterType

      const matchesCategory =
        filterCategory === 'all' || item.category === filterCategory

      const matchesMonth =
        filterMonth === 'all' || item.date.startsWith(filterMonth)

      return (
        matchesSearch &&
        matchesType &&
        matchesCategory &&
        matchesMonth
      )
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return a.date.localeCompare(b.date)
        case 'highest':
          return b.amount - a.amount
        case 'lowest':
          return a.amount - b.amount
        default:
          return b.date.localeCompare(a.date)
      }
    })

  const filteredIncome = filteredTransactions
    .filter((item) => item.type === 'income')
    .reduce((sum, item) => sum + item.amount, 0)

  const filteredExpenses = filteredTransactions
    .filter((item) => item.type === 'expense')
    .reduce((sum, item) => sum + item.amount, 0)

  const hasFilters =
    filterType !== 'all' ||
    filterCategory !== 'all' ||
    filterMonth !== 'all' ||
    sortBy !== 'recent' ||
    search.trim() !== ''

  function clearFilters(): void {
    setFilterType('all')
    setFilterCategory('all')
    setFilterMonth('all')
    setSortBy('recent')
    setSearch('')
  }

  // ======================================
  // GRÁFICO
  // ======================================

  const chartMonths = Array.from({ length: 6 }, (_, index) => {
    const monthDate = new Date(
      currentYear,
      currentMonth - 1 - (5 - index),
      1
    )

    const year = monthDate.getFullYear()
    const month = monthDate.getMonth() + 1

    const items = transactions.filter((item) => {
      const [transactionYear, transactionMonth] =
        item.date.split('-').map(Number)

      return transactionYear === year && transactionMonth === month
    })

    return {
      key: `${year}-${month}`,
      label: monthDate.toLocaleDateString('pt-BR', {
        month: 'short',
      }),
      income: items
        .filter((item) => item.type === 'income')
        .reduce((sum, item) => sum + item.amount, 0),
      expenses: items
        .filter((item) => item.type === 'expense')
        .reduce((sum, item) => sum + item.amount, 0),
    }
  })

  const maxChartValue = Math.max(
    1,
    ...chartMonths.flatMap((item) => [
      item.income,
      item.expenses,
    ])
  )

  // ======================================
  // FUNÇÕES DAS TRANSAÇÕES
  // ======================================

  function openTransactionModal(): void {
    setEditingId(null)
    setName('')
    setAmount('')
    setCategory('Outros')
    setDate(today())
    setType('expense')
    setModalOpen(true)
  }

  function editTransaction(transaction: Transaction): void {
    setEditingId(transaction.id)
    setName(transaction.name)
    setAmount(String(transaction.amount))
    setCategory(transaction.category)
    setDate(transaction.date)
    setType(transaction.type)
    setModalOpen(true)
  }

  function closeTransactionModal(): void {
    setModalOpen(false)
    setEditingId(null)
  }

  function saveTransaction(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()

    const value = Number(amount)

    if (
      !name.trim() ||
      !Number.isFinite(value) ||
      value <= 0 ||
      !validDate(date)
    ) {
      window.alert('Preencha os campos corretamente.')
      return
    }

    const data = {
      name: name.trim(),
      amount: Math.round((value + Number.EPSILON) * 100) / 100,
      category,
      date,
      type,
    }

    if (editingId !== null) {
      setTransactions((previous) =>
        previous.map((item) =>
          item.id === editingId ? { ...item, ...data } : item
        )
      )
    } else {
      const newTransaction: Transaction = {
        id: crypto.randomUUID(),
        ...data,
      }

      setTransactions((previous) => [
        newTransaction,
        ...previous,
      ])
    }

    closeTransactionModal()
  }

  function deleteTransaction(id: string): void {
    if (!window.confirm('Deseja excluir esta transação?')) {
      return
    }

    setTransactions((previous) =>
      previous.filter((item) => item.id !== id)
    )
  }

  // ======================================
  // FUNÇÕES DAS METAS
  // ======================================

  function openGoalModal(): void {
    setEditingGoalId(null)
    setGoalName('')
    setGoalTarget('')
    setGoalSaved('0')
    setGoalModalOpen(true)
  }

  function editGoal(goal: FinancialGoal): void {
    setEditingGoalId(goal.id)
    setGoalName(goal.name)
    setGoalTarget(String(goal.target))
    setGoalSaved(String(goal.saved))
    setGoalModalOpen(true)
  }

  function closeGoalModal(): void {
    setGoalModalOpen(false)
    setEditingGoalId(null)
  }

  function saveGoal(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()

    const target = Number(goalTarget)
    const saved = Number(goalSaved)

    if (
      !goalName.trim() ||
      !Number.isFinite(target) ||
      target <= 0 ||
      !Number.isFinite(saved) ||
      saved < 0
    ) {
      window.alert('Preencha os valores da meta corretamente.')
      return
    }

    const data = {
      name: goalName.trim(),
      target: Math.round((target + Number.EPSILON) * 100) / 100,
      saved: Math.round((saved + Number.EPSILON) * 100) / 100,
    }

    if (editingGoalId !== null) {
      setGoals((previous) =>
        previous.map((goal) =>
          goal.id === editingGoalId
            ? { ...goal, ...data }
            : goal
        )
      )
    } else {
      const newGoal: FinancialGoal = {
        id: crypto.randomUUID(),
        ...data,
      }

      setGoals((previous) => [...previous, newGoal])
    }

    closeGoalModal()
  }

  function deleteGoal(id: string): void {
    if (!window.confirm('Deseja realmente excluir esta meta?')) {
      return
    }

    setGoals((previous) =>
      previous.filter((goal) => goal.id !== id)
    )
  }

  // ======================================
  // DEPÓSITOS NAS METAS
  // ======================================

  function openDepositModal(goal: FinancialGoal): void {
    setDepositGoalId(goal.id)
    setDepositAmount('')
  }

  function closeDepositModal(): void {
    setDepositGoalId(null)
    setDepositAmount('')
  }

  function saveDeposit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()

    const value = Number(depositAmount)

    if (!Number.isFinite(value) || value <= 0) {
      window.alert('Informe um valor maior que zero.')
      return
    }

    const roundedValue =
      Math.round((value + Number.EPSILON) * 100) / 100

    if (roundedValue <= 0) {
      window.alert('O valor mínimo é R$ 0,01.')
      return
    }

    setGoals((previous) =>
      previous.map((goal) =>
        goal.id === depositGoalId
          ? {
            ...goal,
            saved:
              Math.round((goal.saved + roundedValue) * 100) / 100,
          }
          : goal
      )
    )

    closeDepositModal()
  }

  const selectedDepositGoal = goals.find(
    (goal) => goal.id === depositGoalId
  )

  const totalGoalTargets = goals.reduce(
    (sum, goal) => sum + goal.target,
    0
  )

  const totalGoalSaved = goals.reduce(
    (sum, goal) => sum + goal.saved,
    0
  )

  // ======================================
  // INTERFACE
  // ======================================

  return (
    <div className="app-layout">

      {/* MENU LATERAL */}

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-top">
          <div className="brand">
            <div className="brand-icon">
              <Wallet size={24} />
            </div>

            <span>
              Fin<span className="brand-highlight">Track</span>
            </span>
          </div>

          <button
            type="button"
            className="close-sidebar"
            onClick={() => setSidebarOpen(false)}
            aria-label="Fechar menu"
          >
            <X size={22} />
          </button>
        </div>

        <p className="menu-label">MENU PRINCIPAL</p>

        <nav className="nav-menu">
          <a
            href="#dashboard"
            className="nav-link active"
            onClick={() => setSidebarOpen(false)}
          >
            <LayoutDashboard size={19} />
            Visão Geral
          </a>

          <a
            href="#transactions"
            className="nav-link"
            onClick={() => setSidebarOpen(false)}
          >
            <ArrowLeftRight size={19} />
            Transações
          </a>

          <a
            href="#goals"
            className="nav-link"
            onClick={() => setSidebarOpen(false)}
          >
            <Target size={19} />
            Metas Financeiras
          </a>


          <a
            href="#detailed-reports"
            className="nav-link"
            onClick={() => setSidebarOpen(false)}
          >
            <BarChart3 size={19} />
            Relatórios
          </a>

        </nav>

        <p className="menu-label secondary-label">
          PREFERÊNCIAS
        </p>

        <nav className="nav-menu">
          <a
            href="#settings"
            className="nav-link"
            onClick={() => setSidebarOpen(false)}
          >
            <Settings size={19} />
            Configurações
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div className="profile-avatar">FT</div>

          <div className="profile-info">
            <strong>Usuário Demo</strong>
            <span>Dados salvos neste navegador</span>
          </div>

          <ChevronDown size={16} />
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* CONTEÚDO PRINCIPAL */}

      <main className="main-content" id="dashboard">

        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="mobile-menu-button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu size={23} />
            </button>

            <div>
              <p className="breadcrumb">Páginas / Visão Geral</p>
              <h1>Dashboard</h1>
            </div>
          </div>

          <div className="topbar-actions">
            <button
              type="button"
              className="icon-button"
              aria-label="Pesquisar transações"
              onClick={() =>
                setShowSearch((previous) => !previous)
              }
            >
              <Search size={20} />
            </button>

            <button
              type="button"
              className="icon-button notification-button"
              aria-label="Notificações"
              title="Notificações em desenvolvimento"
            >
              <Bell size={20} />
              <span className="notification-dot" />
            </button>

            <div className="topbar-avatar">FT</div>
          </div>
        </header>

        <div className="dashboard-content">

          {/* PESQUISA */}

          {showSearch && (
            <div className="search-panel">
              <Search size={18} />

              <input
                type="search"
                placeholder="Buscar transações..."
                value={search}
                onChange={(event) =>
                  setSearch(event.currentTarget.value)
                }
              />

              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  setShowSearch(false)
                }}
                aria-label="Fechar pesquisa"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {/* BOAS-VINDAS */}

          <div className="welcome-section">
            <div>
              <p className="eyebrow">PAINEL FINANCEIRO</p>
              <h2>Seu dinheiro, sob controle.</h2>

              <p>
                Acompanhe suas finanças e tome decisões mais inteligentes.
              </p>
            </div>

            <button
              type="button"
              className="primary-button"
              onClick={openTransactionModal}
            >
              <Plus size={18} />
              Nova transação
            </button>
          </div>

          {/* CARDS DE RESUMO */}

          <section
            className="summary-grid"
            aria-label="Resumo financeiro"
          >

            <div className="summary-card balance-card">
              <div className="summary-card-header">
                <span>Saldo total</span>

                <div className="summary-icon balance-icon">
                  <Wallet size={21} />
                </div>
              </div>

              <h3>{money(balance)}</h3>

              <p className="summary-description">
                <span className={balance >= 0 ? 'positive' : 'negative'}>
                  {balance >= 0 ? (
                    <ArrowUpRight size={16} />
                  ) : (
                    <TrendingDown size={16} />
                  )}
                  Saldo acumulado
                </span>
              </p>
            </div>

            <div className="summary-card">
              <div className="summary-card-header">
                <span>Receitas do mês</span>

                <div className="summary-icon income-icon">
                  <TrendingUp size={21} />
                </div>
              </div>

              <h3>{money(monthlyIncome)}</h3>

              <p className="summary-description">
                <span className="positive">
                  <ArrowUpRight size={16} />
                  {monthlyTransactions.filter(
                    (item) => item.type === 'income'
                  ).length}{' '}
                  entrada(s) neste mês
                </span>
              </p>
            </div>

            <div className="summary-card">
              <div className="summary-card-header">
                <span>Despesas do mês</span>

                <div className="summary-icon expense-icon">
                  <TrendingDown size={21} />
                </div>
              </div>

              <h3>{money(monthlyExpenses)}</h3>

              <p className="summary-description">
                <span className="negative">
                  <TrendingDown size={16} />
                  {monthlyTransactions.filter(
                    (item) => item.type === 'expense'
                  ).length}{' '}
                  saída(s) neste mês
                </span>
              </p>
            </div>

          </section>

          {/* GRÁFICO E METAS */}

          <div className="dashboard-grid">

            {/* GRÁFICO */}

            <section className="content-card chart-card" id="reports">
              <div className="card-heading">
                <div>
                  <h3>Visão financeira</h3>
                  <p>Comparativo de receitas e despesas</p>
                </div>

                <span className="period-label">
                  Últimos 6 meses
                  <ChevronDown size={15} />
                </span>
              </div>

              <div className="chart-legend">
                <span>
                  <i className="legend-income" /> Receitas
                </span>

                <span>
                  <i className="legend-expense" /> Despesas
                </span>
              </div>

              <div className="chart-container">
                {chartMonths.map((month) => (
                  <div className="chart-column" key={month.key}>
                    <div className="chart-bars">
                      <div
                        className="chart-bar income-bar"
                        title={`Receitas: ${money(month.income)}`}
                        style={{
                          height: `${(month.income / maxChartValue) * 100
                            }%`,
                        }}
                      />

                      <div
                        className="chart-bar expense-bar"
                        title={`Despesas: ${money(month.expenses)}`}
                        style={{
                          height: `${(month.expenses / maxChartValue) * 100
                            }%`,
                        }}
                      />
                    </div>

                    <span>{month.label}</span>
                  </div>
                ))}
              </div>

              <p className="demo-note">
                Gráfico atualizado automaticamente com suas transações.
              </p>
            </section>

            {/* METAS FINANCEIRAS REAIS */}

            <section
              className="content-card goals-card"
              id="goals"
            >
              <div className="card-heading">
                <div>
                  <h3>Metas financeiras</h3>
                  <p>
                    {goals.length === 0
                      ? 'Organize seus objetivos'
                      : `${goals.length} meta(s) cadastrada(s)`}
                  </p>
                </div>

                <Target size={19} className="muted-icon" />
              </div>

              <button
                type="button"
                className="goal-create-button"
                onClick={openGoalModal}
              >
                <Plus size={17} />
                Nova meta
              </button>

              {goals.length === 0 ? (
                <div className="goals-empty">
                  <PiggyBank size={30} />
                  <strong>Nenhuma meta cadastrada</strong>
                  <p>
                    Crie sua primeira meta e acompanhe
                    quanto falta para realizá-la.
                  </p>
                </div>
              ) : (
                <>
                  <div className="goals-list">
                    {goals.map((goal, index) => {
                      const percentage =
                        (goal.saved / goal.target) * 100

                      const progress = Math.min(100, percentage)

                      const remaining = Math.max(
                        0,
                        goal.target - goal.saved
                      )

                      const colors = [
                        '',
                        'purple',
                        'blue',
                      ]

                      const colorClass =
                        colors[index % colors.length]

                      return (
                        <div className="goal-item" key={goal.id}>

                          <div className="goal-header">
                            <strong>{goal.name}</strong>
                            <span>
                              {Math.round(percentage)}%
                            </span>
                          </div>

                          <div
                            className="progress-bar"
                            role="progressbar"
                            aria-label={`Progresso de ${goal.name}`}
                            aria-valuenow={Math.round(progress)}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          >
                            <div
                              className={`progress-fill ${colorClass}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>

                          <p>
                            {money(goal.saved)} de {money(goal.target)}
                          </p>

                          <p className="goal-remaining">
                            {remaining === 0
                              ? 'Meta atingida!'
                              : `Faltam ${money(remaining)}`}
                          </p>

                          <div className="goal-actions">
                            <button
                              type="button"
                              className="goal-deposit-button"
                              onClick={() => openDepositModal(goal)}
                            >
                              <Plus size={14} />
                              Adicionar dinheiro
                            </button>

                            <button
                              type="button"
                              className="goal-icon-button"
                              title="Editar meta"
                              aria-label={`Editar ${goal.name}`}
                              onClick={() => editGoal(goal)}
                            >
                              <Pencil size={15} />
                            </button>

                            <button
                              type="button"
                              className="goal-icon-button goal-delete-button"
                              title="Excluir meta"
                              aria-label={`Excluir ${goal.name}`}
                              onClick={() => deleteGoal(goal.id)}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>

                        </div>
                      )
                    })}
                  </div>

                  <div className="goals-total">
                    <span>Total acumulado nas metas</span>
                    <strong>{money(totalGoalSaved)}</strong>
                    <small>
                      Objetivo total: {money(totalGoalTargets)}
                    </small>
                  </div>
                </>
              )}
            </section>

          </div>

          {/* TRANSAÇÕES */}

          <section
            className="content-card transactions-card"
            id="transactions"
          >
            <div className="card-heading">
              <div>
                <h3>Transações recentes</h3>
                <p>
                  {filteredTransactions.length} de {transactions.length}
                  {' '}movimentação(ões) exibida(s)
                </p>
              </div>

              <button
                type="button"
                className="text-action"
                onClick={openTransactionModal}
              >
                <Plus size={16} />
                Adicionar
              </button>
            </div>

            {/* FILTROS */}

            <div className="filters-panel">
              <div className="filters-title">
                <span>
                  <Filter size={17} />
                  Filtrar transações
                </span>

                <button
                  type="button"
                  className="clear-filters"
                  onClick={clearFilters}
                  disabled={!hasFilters}
                >
                  <RotateCcw size={15} />
                  Limpar filtros
                </button>
              </div>

              <div className="filters-grid">

                <label className="filter-field">
                  <span>Tipo</span>
                  <select
                    value={filterType}
                    onChange={(event) =>
                      setFilterType(
                        event.currentTarget.value as FilterType
                      )
                    }
                  >
                    <option value="all">Todas</option>
                    <option value="income">Receitas</option>
                    <option value="expense">Despesas</option>
                  </select>
                </label>

                <label className="filter-field">
                  <span>Categoria</span>
                  <select
                    value={filterCategory}
                    onChange={(event) =>
                      setFilterCategory(event.currentTarget.value)
                    }
                  >
                    <option value="all">Todas as categorias</option>
                    {categories.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="filter-field">
                  <span>Mês e ano</span>
                  <select
                    value={filterMonth}
                    onChange={(event) =>
                      setFilterMonth(event.currentTarget.value)
                    }
                  >
                    <option value="all">Todos os períodos</option>
                    {availableMonths.map((month) => (
                      <option key={month} value={month}>
                        {monthLabel(month)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="filter-field">
                  <span>Ordenar por</span>
                  <select
                    value={sortBy}
                    onChange={(event) =>
                      setSortBy(
                        event.currentTarget.value as SortType
                      )
                    }
                  >
                    <option value="recent">Mais recentes</option>
                    <option value="oldest">Mais antigas</option>
                    <option value="highest">Maior valor</option>
                    <option value="lowest">Menor valor</option>
                  </select>
                </label>

              </div>

              <div className="filter-summary">
                <span>
                  <TrendingUp size={15} />
                  Receitas: <strong>{money(filteredIncome)}</strong>
                </span>

                <span>
                  <TrendingDown size={15} />
                  Despesas: <strong>{money(filteredExpenses)}</strong>
                </span>
              </div>
            </div>

            {/* LISTA DE TRANSAÇÕES */}

            <div className="transactions-list">
              {filteredTransactions.length === 0 ? (
                <div className="empty-transactions">
                  <Wallet size={32} />
                  <h4>Nenhuma transação encontrada</h4>
                  <p>
                    {transactions.length === 0
                      ? 'Clique em Nova transação para começar.'
                      : 'Tente mudar ou limpar os filtros.'}
                  </p>
                </div>
              ) : (
                filteredTransactions.map((transaction) => {
                  const Icon = categoryIcon(transaction.category)

                  return (
                    <div
                      className="transaction-row"
                      key={transaction.id}
                    >
                      <div className="transaction-left">
                        <div className="transaction-icon">
                          <Icon size={20} />
                        </div>

                        <div className="transaction-details">
                          <strong>{transaction.name}</strong>
                          <span>{transaction.category}</span>
                        </div>
                      </div>

                      <span className="transaction-date">
                        {formatDate(transaction.date)}
                      </span>

                      <strong
                        className={
                          transaction.type === 'income'
                            ? 'transaction-amount positive'
                            : 'transaction-amount negative'
                        }
                      >
                        {transaction.type === 'income' ? '+' : '-'}
                        {money(transaction.amount)}
                      </strong>

                      <button
                        type="button"
                        className="edit-transaction"
                        onClick={() => editTransaction(transaction)}
                        aria-label={`Editar ${transaction.name}`}
                        title="Editar"
                      >
                        <Pencil size={17} />
                      </button>

                      <button
                        type="button"
                        className="delete-transaction"
                        onClick={() => deleteTransaction(transaction.id)}
                        aria-label={`Excluir ${transaction.name}`}
                        title="Excluir"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </section>

          <Reports transactions={transactions} />

          <SettingsPage transactions={transactions} goals={goals} />

          <footer className="dashboard-footer">
            FinTrack © 2026 · Gerencie suas finanças com simplicidade.
          </footer>

        </div>
      </main>

      {/* MODAL DE TRANSAÇÕES */}

      {modalOpen && (
        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeTransactionModal()
            }
          }}
        >
          <div
            className="transaction-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="transaction-modal-title"
          >
            <div className="modal-header">
              <div>
                <p className="eyebrow">FINTRACK</p>

                <h2 id="transaction-modal-title">
                  {editingId !== null
                    ? 'Editar transação'
                    : 'Nova transação'}
                </h2>

                <p>
                  {editingId !== null
                    ? 'Altere os dados da movimentação.'
                    : 'Cadastre uma receita ou despesa.'}
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={closeTransactionModal}
                aria-label="Fechar"
              >
                <X size={21} />
              </button>
            </div>

            <form
              className="transaction-form"
              onSubmit={saveTransaction}
            >
              <div className="transaction-type-buttons">
                <button
                  type="button"
                  className={`type-button ${type === 'income' ? 'selected-income' : ''
                    }`}
                  onClick={() => setType('income')}
                >
                  <TrendingUp size={19} />
                  Receita
                </button>

                <button
                  type="button"
                  className={`type-button ${type === 'expense' ? 'selected-expense' : ''
                    }`}
                  onClick={() => setType('expense')}
                >
                  <TrendingDown size={19} />
                  Despesa
                </button>
              </div>

              <label className="form-field">
                <span>Descrição</span>
                <input
                  type="text"
                  placeholder="Ex.: Salário, mercado, freelance..."
                  value={name}
                  onChange={(event) =>
                    setName(event.currentTarget.value)
                  }
                  maxLength={80}
                  required
                />
              </label>

              <label className="form-field">
                <span>Valor (R$)</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0,00"
                  value={amount}
                  onChange={(event) =>
                    setAmount(event.currentTarget.value)
                  }
                  required
                />
              </label>

              <div className="form-row">
                <label className="form-field">
                  <span>Categoria</span>
                  <select
                    value={category}
                    onChange={(event) =>
                      setCategory(event.currentTarget.value)
                    }
                  >
                    {categories.map((item) => (
                      <option value={item} key={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="form-field">
                  <span>
                    <CalendarDays size={14} />
                    Data
                  </span>
                  <input
                    type="date"
                    value={date}
                    onChange={(event) =>
                      setDate(event.currentTarget.value)
                    }
                    required
                  />
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={closeTransactionModal}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="primary-button"
                >
                  {editingId !== null ? (
                    <Pencil size={18} />
                  ) : (
                    <Plus size={18} />
                  )}

                  {editingId !== null
                    ? 'Salvar alterações'
                    : 'Salvar transação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CRIAR/EDITAR META */}

      {goalModalOpen && (
        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeGoalModal()
            }
          }}
        >
          <div
            className="transaction-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="goal-modal-title"
          >
            <div className="modal-header">
              <div>
                <p className="eyebrow">METAS FINANCEIRAS</p>

                <h2 id="goal-modal-title">
                  {editingGoalId !== null
                    ? 'Editar meta'
                    : 'Nova meta'}
                </h2>

                <p>Defina seu objetivo financeiro.</p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={closeGoalModal}
                aria-label="Fechar"
              >
                <X size={21} />
              </button>
            </div>

            <form
              className="transaction-form"
              onSubmit={saveGoal}
            >
              <label className="form-field">
                <span>Nome da meta</span>

                <input
                  type="text"
                  placeholder="Ex.: Reserva de emergência"
                  value={goalName}
                  onChange={(event) =>
                    setGoalName(event.currentTarget.value)
                  }
                  maxLength={80}
                  required
                />
              </label>

              <label className="form-field">
                <span>Valor desejado (R$)</span>

                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="10000"
                  value={goalTarget}
                  onChange={(event) =>
                    setGoalTarget(event.currentTarget.value)
                  }
                  required
                />
              </label>

              <label className="form-field">
                <span>Valor já acumulado (R$)</span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={goalSaved}
                  onChange={(event) =>
                    setGoalSaved(event.currentTarget.value)
                  }
                  required
                />
              </label>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={closeGoalModal}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="primary-button"
                >
                  {editingGoalId !== null ? (
                    <Pencil size={18} />
                  ) : (
                    <Plus size={18} />
                  )}

                  {editingGoalId !== null
                    ? 'Salvar alterações'
                    : 'Criar meta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE ADICIONAR DINHEIRO */}

      {selectedDepositGoal && (
        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDepositModal()
            }
          }}
        >
          <div
            className="transaction-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="deposit-modal-title"
          >
            <div className="modal-header">
              <div>
                <p className="eyebrow">METAS FINANCEIRAS</p>

                <h2 id="deposit-modal-title">
                  Adicionar dinheiro
                </h2>

                <p>{selectedDepositGoal.name}</p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={closeDepositModal}
                aria-label="Fechar"
              >
                <X size={21} />
              </button>
            </div>

            <form
              className="transaction-form"
              onSubmit={saveDeposit}
            >
              <p className="goal-deposit-info">
                Acumulado atualmente:{' '}
                <strong>
                  {money(selectedDepositGoal.saved)}
                </strong>
              </p>

              <label className="form-field">
                <span>Quanto deseja adicionar? (R$)</span>

                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="100"
                  value={depositAmount}
                  onChange={(event) =>
                    setDepositAmount(event.currentTarget.value)
                  }
                  required
                  autoFocus
                />
              </label>

              <p className="goal-deposit-hint">
                Este registro atualiza apenas o progresso da
                meta, sem alterar o saldo das transações.
              </p>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={closeDepositModal}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="primary-button"
                >
                  <Plus size={18} />
                  Adicionar valor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default App
