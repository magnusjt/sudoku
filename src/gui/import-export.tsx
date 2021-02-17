import React from 'react'
import { loadUserData, mergeUserData, UserData } from './storage'
import { useDropzone } from 'react-dropzone'
import { boardBackgroundColor } from '../theme'
import TextField from '@material-ui/core/TextField'
import Button from '@material-ui/core/Button'
import { hasUniqueSolution } from '../core/utils/hasUniqueSolution'
import { boardFromStr } from '../core/sudoku'
import { getBoardMetaData } from '../core/utils/getBoardMetaData'

export type ImportExportProps = {
    onNewUserData: (userData: UserData) => void
}

const looksLikeUserData = (obj: any) => {
    return Array.isArray(obj.solved) && obj.progress && Array.isArray(obj.custom)
}

const downloadJsonStr = (text, fileName) => {
    const fileType = 'application/json'
    const blob = new Blob([text], { type: fileType })
    const a = document.createElement('a')
    a.download = fileName
    a.href = URL.createObjectURL(blob)
    a.dataset.downloadurl = [fileType, a.download, a.href].join(':')
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(a.href), 1500)
}

export const ImportExport = (props: ImportExportProps) => {
    const { onNewUserData } = props
    const [importState, setImportState] = React.useState<string | null>(null)
    const [importBoardStr, setImportBoardStr] = React.useState('')
    const [boardStrValidation, setBoardStrValidation] = React.useState<string | null>(null)

    const onImport = React.useCallback((str: string) => {
        try{
            const obj = JSON.parse(str)
            if (looksLikeUserData(obj)) {
                const newUserData = mergeUserData(obj)
                onNewUserData(newUserData)
                setImportState('Import successful!')
                return
            }
        }catch(err){}

        setImportState('Failed to import. Please check that the save file was exported from this app.')
    }, [onNewUserData])

    const onImportBoardStr = React.useCallback(() => {
        const str = importBoardStr.trim()
        if (str.length !== 81) {
            setBoardStrValidation('Board must be 81 characters long')
            return
        }
        const board = boardFromStr(str)
        if (!hasUniqueSolution(board)) {
            setBoardStrValidation('That sudoku is not unique')
            return
        }
        const meta = getBoardMetaData(board)
        const newUserData = mergeUserData({
            custom: [{ meta, date: new Date().toISOString() }]
        })
        onNewUserData(newUserData)
        setBoardStrValidation('Import successful! Go to puzzle select to play the imported sudoku')
    }, [importBoardStr, onNewUserData])

    const onExport = React.useCallback(() => {
        const userData = loadUserData()
        downloadJsonStr(JSON.stringify(userData, null, 2), 'sudoku.json')
    }, [])

    const onDrop = React.useCallback((acceptedFiles) => {
        if (acceptedFiles.length === 0) {
            return
        }
        const file = acceptedFiles[0]

        const reader = new FileReader()
        reader.onload = () => onImport(reader.result as string)
        reader.readAsText(file)
    }, [onImport])

    const {getRootProps, getInputProps} = useDropzone({onDrop, maxFiles: 1})

    return (
        <div style={{ minHeight: '600px' }}>
            <h3>Import custom board</h3>

            <TextField
                type={'text'}
                value={importBoardStr}
                onChange={e => setImportBoardStr(e.target.value)}
                fullWidth
                variant={'outlined'}
                placeholder={'Paste board string here (ex. 200030967400...)'}
            />
            {boardStrValidation !== null && boardStrValidation}
            <br />
            <Button
                color={'primary'}
                variant={'contained'}
                onClick={onImportBoardStr}
            >
                Import
            </Button>

            <h3>Import save data</h3>

            <div
                {...getRootProps()}
                style={{
                    width: 400,
                    height: 400,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    background: boardBackgroundColor
                }}
            >
                <input {...getInputProps()} />
                <p>Drag a save file here, or click to select file</p>
            </div>
            {importState !== null && importState}

            <h3>Export save data</h3>

            <Button
                color={'primary'}
                variant={'contained'}
                onClick={onExport}
            >
                Export
            </Button>
        </div>
    )
}