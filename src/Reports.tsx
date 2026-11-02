
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'
import { Download, ChartPie, CalendarDays } from 'lucide-react'
import './Reports.css'

export type ReportTransaction = {
    id: string
    name: string
    category: string
    date: string
    amount: number
    type: 'income' | 'expense'
}

type ReportsProps = {
    transactions: ReportTransaction[]
}

const COLORS = [
    '#2dd4bf',
    '#818cf8',
    '#fb7185',
    '#fbbf24',
    '#60a5fa',
    '#c084fc',
    '#34d399',
    '#fb923c',
    '#38bdf8',
    '#a3e635',
]

const money = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value)

function escapeCSV(value: string | number): string {
    const text = String(value)

    return `"${text.replace(/"/g, '""')}"`
}

function exportCSV(transactions: ReportTransaction[]) {
    if (transactions.length === 0) {
        window.alert('Não há transações para exportar.')
        return
    }

    const headers = [
        'Descrição',
        'Categoria',
        'Data',
        'Tipo',
        'Valor',
    ]

    const rows = transactions.map((transaction) => [
        transaction.name,
        transaction.category,
        transaction.date,
        transaction.type === 'income' ? 'Receita' : 'Despesa',
        transaction.amount.toFixed(2).replace('.', ','),
    ])

    const content = [
        headers.map(escapeCSV).join(';'),
        ...rows.map((row) => row.map(escapeCSV).join(';')),
    ].join('\r\n')

    // O BOM permite que o Excel reconheça UTF-8
    const blob = new Blob(['\uFEFF', content], {
        type: 'text/csv;charset=utf-8;',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = 'fintrack-transacoes.csv'
    document.body.appendChild(link)
    link.click()
    link.remove()

    // Libera o endereço temporário depois do download
    setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function Reports({ transactions }: ReportsProps) {
    const expenseTransactions = transactions.filter(
        (transaction) => transaction.type === 'expense'
    )

    const categoryTotals = expenseTransactions.reduce<
        Record<string, number>
    >((totals, transaction) => {
        totals[transaction.category] =
            (totals[transaction.category] ?? 0) + transaction.amount

        return totals
    }, {})

    const categoryData = Object.entries(categoryTotals)
        .map(([name, value]) => ({
            name,
            value: Math.round(value * 100) / 100,
        }))
        .sort((a, b) => b.value - a.value)

    const categoryExpenseTotal = categoryData.reduce(
        (sum, item) => sum + item.value,
        0
    )

    const monthlyTotals = transactions.reduce<
        Record<string, { income: number; expenses: number }>
    >((totals, transaction) => {
        const key = transaction.date.slice(0, 7)

        if (!totals[key]) {
            totals[key] = { income: 0, expenses: 0 }
        }

        if (transaction.type === 'income') {
            totals[key].income += transaction.amount
        } else {
            totals[key].expenses += transaction.amount
        }

        return totals
    }, {})

    const monthlyData = Object.entries(monthlyTotals)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, totals]) => {
            const [year, month] = key.split('-').map(Number)

            return {
                key,
                month: new Date(year, month - 1, 1).toLocaleDateString(
                    'pt-BR',
                    { month: 'short', year: '2-digit' }
                ),
                receitas: Math.round(totals.income * 100) / 100,
                despesas: Math.round(totals.expenses * 100) / 100,
                saldo:
                    Math.round(
                        (totals.income - totals.expenses) * 100
                    ) / 100,
            }
        })

    const totalIncome = transactions
        .filter((transaction) => transaction.type === 'income')
        .reduce((sum, transaction) => sum + transaction.amount, 0)

    const totalExpenses = expenseTransactions.reduce(
        (sum, transaction) => sum + transaction.amount,
        0
    )

    const biggestCategory = categoryData[0]

    return (
        <section className="reports-section" id="detailed-reports">

            <div className="reports-header">
                <div>
                    <p className="eyebrow">ANÁLISE FINANCEIRA</p>
                    <h2>Relatórios detalhados</h2>
                    <p>
                        Analise sua movimentação e entenda para onde
                        vai seu dinheiro.
                    </p>
                </div>

                <button
                    className="report-export-button"
                    type="button"
                    onClick={() => exportCSV(transactions)}
                    disabled={transactions.length === 0}
                >
                    <Download size={17} />
                    Exportar CSV
                </button>
            </div>

            <div className="report-summary-grid">
                <div className="report-summary-item">
                    <span>Receitas acumuladas</span>
                    <strong className="positive">
                        {money(totalIncome)}
                    </strong>
                </div>

                <div className="report-summary-item">
                    <span>Despesas acumuladas</span>
                    <strong className="negative">
                        {money(totalExpenses)}
                    </strong>
                </div>

                <div className="report-summary-item">
                    <span>Saldo acumulado</span>
                    <strong
                        className={
                            totalIncome - totalExpenses >= 0
                                ? 'positive'
                                : 'negative'
                        }
                    >
                        {money(totalIncome - totalExpenses)}
                    </strong>
                </div>
            </div>

            <div className="reports-charts-grid">

                {/* DESPESAS POR CATEGORIA */}

                <div className="report-chart-card">
                    <div className="report-card-heading">
                        <ChartPie size={19} />
                        <div>
                            <h3>Despesas por categoria</h3>
                            <p>Distribuição de todos os gastos registrados</p>
                        </div>
                    </div>

                    {categoryData.length === 0 ? (
                        <div className="report-empty">
                            Cadastre uma despesa para visualizar este gráfico.
                        </div>
                    ) : (
                        <>
                            <div className="report-chart-area">
                                <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                >
                                    <PieChart>
                                        <Pie
                                            data={categoryData}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={65}
                                            outerRadius={105}
                                            paddingAngle={3}
                                        >
                                            {categoryData.map((item, index) => (
                                                <Cell
                                                    key={item.name}
                                                    fill={COLORS[index % COLORS.length]}
                                                />
                                            ))}
                                        </Pie>

                                        <Tooltip
                                            formatter={(value) =>
                                                money(Number(value ?? 0))
                                            }
                                            contentStyle={{
                                                backgroundColor: '#172338',
                                                border: '1px solid #334155',
                                                borderRadius: '10px',
                                                color: '#e2e8f0',
                                            }}
                                            itemStyle={{ color: '#e2e8f0' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="report-categories">
                                {categoryData.map((item, index) => {
                                    const percentage =
                                        categoryExpenseTotal > 0
                                            ? (item.value / categoryExpenseTotal) * 100
                                            : 0

                                    return (
                                        <div
                                            className="report-category-row"
                                            key={item.name}
                                        >
                                            <span
                                                className="report-category-dot"
                                                style={{
                                                    backgroundColor:
                                                        COLORS[index % COLORS.length],
                                                }}
                                            />

                                            <span className="report-category-name">
                                                {item.name}
                                            </span>

                                            <span className="report-category-amount">
                                                {money(item.value)}
                                            </span>

                                            <strong>{percentage.toFixed(1)}%</strong>
                                        </div>
                                    )
                                })}
                            </div>

                            {biggestCategory && (
                                <p className="report-insight">
                                    Maior categoria de despesas:{' '}
                                    <strong>{biggestCategory.name}</strong>
                                    {' '}({money(biggestCategory.value)}).
                                </p>
                            )}
                        </>
                    )}
                </div>

                {/* COMPARATIVO MENSAL */}

                <div className="report-chart-card">
                    <div className="report-card-heading">
                        <CalendarDays size={19} />
                        <div>
                            <h3>Comparativo mensal</h3>
                            <p>Receitas e despesas mês a mês</p>
                        </div>
                    </div>

                    {monthlyData.length === 0 ? (
                        <div className="report-empty">
                            Cadastre uma transação para visualizar este gráfico.
                        </div>
                    ) : (
                        <div className="report-chart-area">
                            <ResponsiveContainer
                                width="100%"
                                height="100%"
                            >
                                <BarChart
                                    data={monthlyData}
                                    margin={{
                                        top: 12,
                                        right: 8,
                                        left: 0,
                                        bottom: 8,
                                    }}
                                >
                                    <CartesianGrid
                                        stroke="#29374a"
                                        strokeDasharray="3 3"
                                        vertical={false}
                                    />

                                    <XAxis
                                        dataKey="month"
                                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />

                                    <YAxis
                                        width={50}
                                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(value) =>
                                            Number(value).toLocaleString('pt-BR', {
                                                notation: 'compact',
                                            })
                                        }
                                    />

                                    <Tooltip
                                        formatter={(value) =>
                                            money(Number(value ?? 0))
                                        }
                                        contentStyle={{
                                            backgroundColor: '#172338',
                                            border: '1px solid #334155',
                                            borderRadius: '10px',
                                            color: '#e2e8f0',
                                        }}
                                    />

                                    <Legend
                                        wrapperStyle={{
                                            color: '#cbd5e1',
                                            fontSize: '12px',
                                        }}
                                    />

                                    <Bar
                                        dataKey="receitas"
                                        name="Receitas"
                                        fill="#2dd4bf"
                                        radius={[5, 5, 0, 0]}
                                        maxBarSize={32}
                                    />

                                    <Bar
                                        dataKey="despesas"
                                        name="Despesas"
                                        fill="#fb7185"
                                        radius={[5, 5, 0, 0]}
                                        maxBarSize={32}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>

            {/* TABELA MENSAL */}

            <div className="report-table-card">
                <h3>Resumo financeiro por mês</h3>

                {monthlyData.length === 0 ? (
                    <p className="report-empty">
                        Nenhuma movimentação cadastrada.
                    </p>
                ) : (
                    <div className="report-table-scroll">
                        <table className="report-table">
                            <thead>
                                <tr>
                                    <th>Mês</th>
                                    <th>Receitas</th>
                                    <th>Despesas</th>
                                    <th>Saldo</th>
                                </tr>
                            </thead>

                            <tbody>
                                {[...monthlyData].reverse().map((month) => (
                                    <tr key={month.key}>
                                        <td>{month.month}</td>

                                        <td className="positive">
                                            {money(month.receitas)}
                                        </td>

                                        <td className="negative">
                                            {money(month.despesas)}
                                        </td>

                                        <td
                                            className={
                                                month.saldo >= 0
                                                    ? 'positive'
                                                    : 'negative'
                                            }
                                        >
                                            {money(month.saldo)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

        </section>
    )
}
