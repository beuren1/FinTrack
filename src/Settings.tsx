
import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'


import {
    Settings as SettingsIcon,
    Download,
    Upload,
    Trash2,
    ShieldCheck,
    Database,
    AlertTriangle,
    CheckCircle2,
    HardDrive,
    Wallet,
} from 'lucide-react'


import './Settings.css'

// ====================================
// TIPOS
// ====================================

type Transaction = {
    id: string
    name: string
    category: string
    date: string
    amount: number
    type: 'income' | 'expense'
}

type FinancialGoal = {
    id: string
    name: string
    target: number
    saved: number
}

type BackupData = {
    app: 'FinTrack'
    version: 1
    exportedAt: string
    transactions: Transaction[]
    goals: FinancialGoal[]
}

type SettingsProps = {
    transactions: Transaction[]
    goals: FinancialGoal[]
}

const TRANSACTIONS_KEY = 'fintrack_transactions'
const GOALS_KEY = 'fintrack_goals'

const money = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value)

// ====================================
// VALIDAÇÃO DE BACKUP
// ====================================

function isRecord(value: unknown): value is Record<string, unknown> {
    return (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
    )
}

function isTransaction(value: unknown): value is Transaction {
    if (!isRecord(value)) return false

    return (
        typeof value.id === 'string' &&
        value.id.length > 0 &&
        typeof value.name === 'string' &&
        value.name.length > 0 &&
        typeof value.category === 'string' &&
        typeof value.date === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test(value.date) &&
        typeof value.amount === 'number' &&
        Number.isFinite(value.amount) &&
        value.amount > 0 &&
        (value.type === 'income' || value.type === 'expense')
    )
}

function isGoal(value: unknown): value is FinancialGoal {
    if (!isRecord(value)) return false

    return (
        typeof value.id === 'string' &&
        value.id.length > 0 &&
        typeof value.name === 'string' &&
        value.name.length > 0 &&
        typeof value.target === 'number' &&
        Number.isFinite(value.target) &&
        value.target > 0 &&
        typeof value.saved === 'number' &&
        Number.isFinite(value.saved) &&
        value.saved >= 0
    )
}

function isBackup(value: unknown): value is BackupData {
    if (!isRecord(value)) return false

    if (
        value.app !== 'FinTrack' ||
        value.version !== 1 ||
        typeof value.exportedAt !== 'string'
    ) {
        return false
    }

    if (
        !Array.isArray(value.transactions) ||
        !Array.isArray(value.goals)
    ) {
        return false
    }

    if (
        !value.transactions.every(isTransaction) ||
        !value.goals.every(isGoal)
    ) {
        return false
    }

    const transactionIds = value.transactions.map(
        (transaction: Transaction) => transaction.id
    )

    const goalIds = value.goals.map(
        (goal: FinancialGoal) => goal.id
    )

    return (
        new Set(transactionIds).size === transactionIds.length &&
        new Set(goalIds).size === goalIds.length
    )
}

// ====================================
// COMPONENTE
// ====================================

export default function Settings({
    transactions,
    goals,
}: SettingsProps) {
    const inputRef = useRef<HTMLInputElement>(null)

    const [message, setMessage] = useState('')
    const [messageType, setMessageType] = useState<
        'success' | 'error'
    >('success')

    const totalIncome = transactions
        .filter((transaction) => transaction.type === 'income')
        .reduce((sum, transaction) => sum + transaction.amount, 0)

    const totalExpenses = transactions
        .filter((transaction) => transaction.type === 'expense')
        .reduce((sum, transaction) => sum + transaction.amount, 0)

    function showMessage(
        text: string,
        type: 'success' | 'error'
    ) {
        setMessage(text)
        setMessageType(type)
    }

    // ====================================
    // BAIXAR BACKUP
    // ====================================

    function downloadBackup() {
        const backup: BackupData = {
            app: 'FinTrack',
            version: 1,
            exportedAt: new Date().toISOString(),
            transactions,
            goals,
        }

        const json = JSON.stringify(backup, null, 2)

        const blob = new Blob([json], {
            type: 'application/json;charset=utf-8',
        })

        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')

        const date = new Date()
            .toLocaleDateString('en-CA')

        link.href = url
        link.download = `fintrack-backup-${date}.json`

        document.body.appendChild(link)
        link.click()
        link.remove()

        window.setTimeout(() => URL.revokeObjectURL(url), 1000)

        showMessage(
            'Backup gerado. Guarde o arquivo JSON em um local seguro.',
            'success'
        )
    }

    // ====================================
    // RESTAURAR BACKUP
    // ====================================

    async function importBackup(
        event: ChangeEvent<HTMLInputElement>
    ) {
        const file = event.currentTarget.files?.[0]

        if (!file) return

        try {
            if (file.size > 5 * 1024 * 1024) {
                throw new Error(
                    'O arquivo ultrapassa o limite de 5 MB.'
                )
            }

            const content = await file.text()
            const parsed: unknown = JSON.parse(content)

            if (!isBackup(parsed)) {
                throw new Error(
                    'Arquivo inválido ou incompatível com o FinTrack.'
                )
            }

            const backup = parsed

            const confirmation = window.confirm(
                `Este backup contém:\n\n` +
                `${backup.transactions.length} transações\n` +
                `${backup.goals.length} metas financeiras\n\n` +
                'A restauração SUBSTITUIRÁ todos os dados atuais ' +
                'deste navegador.\n\nDeseja continuar?'
            )

            if (!confirmation) {
                return
            }

            // Guardar os valores anteriores para poder
            // reverter caso ocorra uma falha de gravação.

            const oldTransactions =
                localStorage.getItem(TRANSACTIONS_KEY)

            const oldGoals =
                localStorage.getItem(GOALS_KEY)

            try {
                localStorage.setItem(
                    TRANSACTIONS_KEY,
                    JSON.stringify(backup.transactions)
                )

                localStorage.setItem(
                    GOALS_KEY,
                    JSON.stringify(backup.goals)
                )
            } catch {
                // Tentativa de restaurar os valores anteriores.
                try {
                    if (oldTransactions === null) {
                        localStorage.removeItem(TRANSACTIONS_KEY)
                    } else {
                        localStorage.setItem(
                            TRANSACTIONS_KEY,
                            oldTransactions
                        )
                    }

                    if (oldGoals === null) {
                        localStorage.removeItem(GOALS_KEY)
                    } else {
                        localStorage.setItem(
                            GOALS_KEY,
                            oldGoals
                        )
                    }
                } catch {
                    throw new Error(
                        'Não foi possível concluir a restauração. ' +
                        'Verifique o armazenamento do navegador.'
                    )
                }

                throw new Error(
                    'Não foi possível salvar o backup no navegador.'
                )
            }

            // Recarrega para que o App.tsx leia
            // as novas transações e metas.
            window.location.reload()
        } catch (error) {
            showMessage(
                error instanceof Error
                    ? error.message
                    : 'Não foi possível importar o backup.',
                'error'
            )
        } finally {
            if (inputRef.current) {
                inputRef.current.value = ''
            }
        }
    }

    // ====================================
    // LIMPAR TODOS OS DADOS
    // ====================================

    function clearAllData() {
        const confirmation = window.confirm(
            'ATENÇÃO!\n\n' +
            'Você está prestes a apagar todas as transações ' +
            'e metas financeiras do FinTrack neste navegador.\n\n' +
            'Essa ação não poderá ser desfeita sem um backup.\n\n' +
            'Deseja continuar?'
        )

        if (!confirmation) return

        const secondConfirmation = window.confirm(
            'Confirma a exclusão definitiva de todos os dados?'
        )

        if (!secondConfirmation) return

        try {
            localStorage.removeItem(TRANSACTIONS_KEY)
            localStorage.removeItem(GOALS_KEY)

            // Atualiza os estados do app após a exclusão.
            window.location.reload()
        } catch {
            showMessage(
                'Não foi possível limpar os dados deste navegador.',
                'error'
            )
        }
    }

    return (
        <section className="settings-section" id="settings">

            <div className="settings-heading">
                <div className="settings-heading-icon">
                    <SettingsIcon size={23} />
                </div>

                <div>
                    <p className="eyebrow">PREFERÊNCIAS</p>
                    <h2>Configurações</h2>
                    <p>
                        Gerencie seus dados e faça cópias de segurança.
                    </p>
                </div>
            </div>

            {/* RESUMO DOS DADOS */}

            <div className="settings-stats">
                <div>
                    <Database size={19} />
                    <span>Transações</span>
                    <strong>{transactions.length}</strong>
                </div>

                <div>
                    <PiggyBankIcon />
                    <span>Metas financeiras</span>
                    <strong>{goals.length}</strong>
                </div>

                <div>
                    <Wallet size={19} />
                    <span>Saldo registrado</span>
                    <strong>{money(totalIncome - totalExpenses)}</strong>
                </div>
            </div>

            {/* BACKUP */}

            <div className="settings-card">
                <div className="settings-card-title">
                    <Download size={20} />

                    <div>
                        <h3>Exportar backup</h3>
                        <p>
                            Baixe todas as transações e metas financeiras
                            em um arquivo JSON.
                        </p>
                    </div>
                </div>

                <div className="settings-card-bottom">
                    <span>
                        <ShieldCheck size={16} />
                        Backup completo dos seus registros
                    </span>

                    <button
                        type="button"
                        className="settings-primary-button"
                        onClick={downloadBackup}
                    >
                        <Download size={17} />
                        Baixar backup
                    </button>
                </div>
            </div>

            {/* IMPORTAR BACKUP */}

            <div className="settings-card">
                <div className="settings-card-title">
                    <Upload size={20} />

                    <div>
                        <h3>Restaurar backup</h3>
                        <p>
                            Importe um backup anterior para recuperar
                            suas transações e metas financeiras.
                        </p>
                    </div>
                </div>

                <div className="settings-card-bottom">
                    <span>
                        <HardDrive size={16} />
                        Arquivo JSON do FinTrack (até 5 MB)
                    </span>

                    <input
                        ref={inputRef}
                        type="file"
                        accept=".json,application/json"
                        onChange={importBackup}
                        className="settings-hidden-input"
                        aria-label="Selecionar backup JSON"
                    />

                    <button
                        type="button"
                        className="settings-secondary-button"
                        onClick={() => inputRef.current?.click()}
                    >
                        <Upload size={17} />
                        Selecionar arquivo
                    </button>
                </div>

                <p className="settings-warning-text">
                    <AlertTriangle size={15} />
                    Restaurar um backup substituirá os dados atuais
                    deste navegador.
                </p>
            </div>

            {/* ZONA DE PERIGO */}

            <div className="settings-card settings-danger-card">
                <div className="settings-card-title">
                    <Trash2 size={20} />

                    <div>
                        <h3>Limpar todos os dados</h3>
                        <p>
                            Apague todas as transações e metas financeiras
                            armazenadas neste navegador.
                        </p>
                    </div>
                </div>

                <div className="settings-card-bottom">
                    <span>
                        <AlertTriangle size={16} />
                        Faça um backup antes de apagar seus registros.
                    </span>

                    <button
                        type="button"
                        className="settings-danger-button"
                        onClick={clearAllData}
                        disabled={
                            transactions.length === 0 &&
                            goals.length === 0
                        }
                    >
                        <Trash2 size={17} />
                        Apagar dados
                    </button>
                </div>
            </div>

            {/* STATUS */}

            {message && (
                <div
                    className={`settings-message ${messageType}`}
                    role="status"
                >
                    {messageType === 'success' ? (
                        <CheckCircle2 size={19} />
                    ) : (
                        <AlertTriangle size={19} />
                    )}
                    {message}
                </div>
            )}

            <p className="settings-privacy-note">
                <ShieldCheck size={16} />
                Seus dados ficam armazenados neste navegador.
                O FinTrack não envia essas informações a um servidor.
            </p>

        </section>
    )
}

// Ícone separado para o resumo
function PiggyBankIcon() {
    return <Database size={19} />
}
