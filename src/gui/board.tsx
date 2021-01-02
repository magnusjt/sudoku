import { Board, Cell, Effect, Point, SolveResult, ValueEffect } from '../core/types'
import React from 'react'
import { getAffectedPoints, pointHasError, pointsEqual } from '../core/utils'

const Candidates = (props) => {
    const height = props.height
    const width = props.width

    const fontSize = height / 4
    const boxSize = height / 3
    const spacing = (boxSize - fontSize)/2

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', fontSize: fontSize, fontFamily: 'monospace', color: '#666' }}>
            {props.candidates.map(number => {
                const top = Math.round(Math.floor((number - 1) / 3) * boxSize + spacing)
                const left = Math.round(Math.floor((number - 1) % 3) * boxSize + spacing)
                return (
                    <div style={{ position: 'absolute', top, left }} key={number}>
                        {number}
                    </div>
                )
            })}
        </div>
    )
}

type CellDisplayProps = {
    solveResult: SolveResult | null
    selected: boolean
    affected: boolean
    board: Board
    cell: Cell
    point: Point
    highlightedNumber: number | null
}

const CellDisplay = (props: CellDisplayProps) => {
    const {effects, actors} = props.solveResult ?? {effects: [], actors: []}
    const {board, point, selected, affected, cell, highlightedNumber} = props

    const hasElimination = effects.filter((eff: Effect) => eff.type === 'elimination').some((eff) => pointsEqual((eff as ValueEffect).point, point))
    const hasSetValue = effects.filter((eff: Effect) => eff.type === 'value').some((eff) => pointsEqual((eff as ValueEffect).point, point))
    const hasActor = actors.some(actor => pointsEqual(actor.point, point))
    const hasError = React.useMemo(() => pointHasError(board, point), [board, point])

    let bg = 'white'

    if(affected) bg = '#efefef'
    if(hasElimination) bg = '#b0c9f6'
    if(hasActor) bg = '#c5f6b0'
    if(hasSetValue) bg = '#85ffff'
    if(selected) bg = '#ffc0b0'

    if((cell.value && cell.value === highlightedNumber) || cell.candidates.some(c => c === highlightedNumber)){
        bg = '#ffc0b0'
    }

    if(hasError) bg = '#fc4444'

    let style: any = {
        backgroundColor: bg,
        border: '1px #aaa solid',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: 60,
        height: 60
    }
    const {x, y} = point
    if(x % 3 === 0 && x > 0){
        style = {...style, borderLeft: '2px #000 solid'}
    }
    if(y % 3 === 0 && y > 0){
        style = {...style, borderTop: '2px #000 solid'}
    }

    return (
        <div style={style}>
            {cell.value === null
                ? <Candidates candidates={cell.candidates} width={style.width} height={style.height} />
                : <span style={{ fontSize: Math.floor(style.height/2) }}>{cell.value}</span>
            }
        </div>
    )
}

export type BoardDisplayProps = {
    board: Board
    solveResult: SolveResult | null
    onSetDigit: (digit: number, points: Point[]) => void
}

export const BoardDisplay = (props: BoardDisplayProps) => {
    const {board, onSetDigit} = props

    const [selectedCells, setSelectedCells] = React.useState<Point[]>([])
    const [isSelecting, setIsSelecting] = React.useState(false)

    const highlightedNumber = selectedCells.length === 1 ? board[selectedCells[0].y][selectedCells[0].x].value : null
    const affectedPoints = selectedCells.length === 1
        ? getAffectedPoints(selectedCells[0])
        : []

    const onKeyDown = (e: React.KeyboardEvent) => {
        if(/\d/.test(e.key)){
            const number = parseInt(e.key, 10)
            if(number >= 1 && number <= 9){
                onSetDigit(number, selectedCells)
            }
        }
    }
    const selectDigit = (digit: number) => {
        onSetDigit(digit, selectedCells)
    }
    const startSelect = (point, e: React.MouseEvent) => {
        if(e.ctrlKey){
            setSelectedCells(points => [...points, point])
        }else{
            setSelectedCells([point])
        }
        setIsSelecting(true)
    }
    const addSelect = (point) => {
        if(isSelecting){
            setSelectedCells(points => [...points, point])
        }
    }
    const endSelect = () => {
        setIsSelecting(false)
    }

    return (
        <div onKeyDown={onKeyDown} tabIndex={-1}>
            {board.map((row, y) => {
                const cells = row.map((cell, x) => {
                    const point = {x, y}
                    const selected = selectedCells.some(p => pointsEqual(p, point))
                    const affected = affectedPoints.some(p => pointsEqual(p, point))
                    return (
                        <div
                            key={x}
                            onMouseDown={(e) => startSelect({x, y}, e)}
                            onMouseOver={() => addSelect({x, y})}
                            onMouseUp={() => endSelect()}
                            style={{
                                'WebkitTouchCallout': 'none',
                                'WebkitUserSelect': 'none',
                                'KhtmlUserSelect': 'none',
                                'MozUserSelect': 'none',
                                'msUserSelect': 'none',
                                'userSelect': 'none',
                            }}
                        >
                            <CellDisplay
                                board={board}
                                cell={cell}
                                selected={selected}
                                affected={affected}
                                point={{x, y}}
                                solveResult={props.solveResult}
                                highlightedNumber={highlightedNumber}
                            />
                        </div>
                    )
                })
                return (
                    <div style={{display: 'flex'}} key={y}>
                        {cells}
                    </div>
                )
            })}
        </div>
    )
}