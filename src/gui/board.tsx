import {
    Actor,
    Board,
    Cell,
    Effect,
    EliminationEffect,
    Point,
    SolveResult,
    ValueEffect
} from '../core/types'
import React from 'react'
import { getAffectedPoints, getBoardCell, getPointId, pointsEqual } from '../core/utils/sudokuUtils'
import useEventListener from '@use-it/event-listener'
import {
    actorCandidateColor, actorChainCandidateNoColor, actorChainCandidateYesColor,
    actorColor,
    affectedColor,
    boardBackgroundColor,
    boardBorderColor,
    boardBorderHardColor, eliminateCandidateColor,
    eliminationColor,
    errorColor,
    getContrastText, highlightedCandidateColor,
    highlightedColor,
    selectedColor,
    selectedDigitHighlightColor, setCandidateColor,
    setValueColor
} from '../theme'
import { darken } from '@material-ui/core/styles'
import { uniqueBy } from '../core/utils/misc'

const Candidates = (props) => {
    const height = props.height

    const fontSize = height / 4
    const boxSize = height / 3
    const spacing = (boxSize - fontSize)/2

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', fontSize: fontSize, fontFamily: 'monospace', color: 'inherit' }}>
            {props.candidates.map(number => {
                const top = Math.round(Math.floor((number - 1) / 3) * boxSize)
                const left = Math.round(Math.floor((number - 1) % 3) * boxSize)
                return (
                    <div
                        style={{
                            position: 'absolute',
                            background: props.bgs[number] ?? '',
                            top,
                            left,
                            width: Math.round(boxSize),
                            padding: Math.round(spacing),
                            display: 'flex',
                            justifyContent: 'center'
                        }}
                        key={number}
                    >
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
    cell: Cell
    point: Point
    highlightedNumber: number | null
    selectedDigit: number | null
    solutionValue: number
    celebration: boolean
}

const cellHasElimination = (effects: Effect[], point: Point) => effects
    .filter((eff: Effect) => eff.type === 'elimination')
    .some((eff) => pointsEqual((eff as EliminationEffect).point, point))

const cellHasSetValue = (effects: Effect[], point: Point) => effects
    .filter((eff: Effect) => eff.type === 'value')
    .some((eff) => pointsEqual((eff as ValueEffect).point, point))

const cellHasActor = (actors: Actor[], point: Point) => actors
    .some(actor => pointsEqual(actor.point, point))

const getCellBackgroundColor = (
    actors: Actor[],
    effects: Effect[],
    point: Point,
    cell: Cell,
    affected: boolean,
    selected: boolean,
    highlightedNumber: number | null,
    selectedDigit: number | null,
    solutionValue: number
) => {
    const hasElimination = cellHasElimination(effects, point)
    const hasSetValue = cellHasSetValue(effects, point)
    const hasActor = cellHasActor(actors, point)
    const hasError = cell.value !== null && cell.value !== solutionValue

    let bg = boardBackgroundColor
    if(affected) bg = affectedColor
    if(hasElimination) bg = eliminationColor
    if(hasActor) bg = actorColor
    if(hasSetValue) bg = setValueColor

    if((cell.value && cell.value === highlightedNumber)){
        bg = highlightedColor
    }
    if(cell.candidates.some(c => c === highlightedNumber)){
        bg = highlightedCandidateColor
    }

    // Highlighted number takes precedence over selected digit highlighting
    // Don't highlight selected digit if cell has highlighting already
    if(!highlightedNumber){
        if((cell.value && cell.value === selectedDigit) || cell.candidates.some(c => c === selectedDigit)){
            bg = selectedDigitHighlightColor
        }
    }

    if(selected) bg = selectedColor
    if(hasError) bg = errorColor

    return bg
}

const getCandidateBackgrounds = (actors: Actor[], effects: Effect[], cell: Cell, point: Point) => {
    const bgs: {[key: number]: string} = {}

    actors = actors.filter(actor => pointsEqual(actor.point, point))
    effects = effects.filter(eff => eff.type !== 'none' && pointsEqual(eff.point, point))

    for(const actor of actors){
        if(actor.cand){
            bgs[actor.cand] = actorCandidateColor
            if(actor.chainSet === 'yes'){
                bgs[actor.cand] = actorChainCandidateYesColor
            }
            if(actor.chainSet === 'no'){
                bgs[actor.cand] = actorChainCandidateNoColor
            }
        }
    }

    for(const eff of effects){
        if(eff.type === 'elimination'){
            for(let cand of eff.numbers){
                bgs[cand] = eliminateCandidateColor
            }
        }
        if(eff.type === 'value' && eff.number !== null){
            bgs[eff.number] = setCandidateColor
        }
    }

    return bgs
}

const CellDisplay = (props: CellDisplayProps) => {
    const {effects, actors} = props.solveResult ?? {effects: [], actors: []}
    const {point, selected, affected, cell, highlightedNumber, solutionValue, selectedDigit, celebration} = props
    const [celebrationCounter, setCelebrationCount] = React.useState(0)

    React.useEffect(() => {
        setCelebrationCount(0)
    }, [celebration])

    React.useEffect(() => {
        if(celebration){
            if(celebrationCounter < 100) {
                setTimeout(() => {
                    setCelebrationCount(celebrationCounter + 1)
                }, 50)
            }
        }
    })

    let bg = React.useMemo(() =>
        getCellBackgroundColor(actors, effects, point, cell, affected, selected, highlightedNumber, selectedDigit, solutionValue)
    , [actors, effects, point, cell, affected, selected, highlightedNumber, selectedDigit, solutionValue])

    const candBgs = React.useMemo(() =>
        getCandidateBackgrounds(actors, effects, cell, point)
    , [actors, effects, cell, point])

    if(props.celebration){
        const pointNumber = (point.y * 9 + point.x)
        const pointOfHundred = Math.round((pointNumber/81)*100)
        const seed = ((pointOfHundred + celebrationCounter)%100)/100
        bg = darken(selectedColor, seed)
    }

    let style: any = {
        backgroundColor: bg,
        color: getContrastText(bg),
        border: '1px solid',
        borderColor: boardBorderColor,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        height: 80,
        lineHeight: 1
    }
    const {x, y} = point
    const addHardBorder = (side) => {
        style = {...style, ['border' + side]: '2px solid ' + boardBorderHardColor}
    }
    if(x % 3 === 0 && x > 0) addHardBorder('Left')
    if(y % 3 === 0 && y > 0) addHardBorder('Top')
    if(x === 0) addHardBorder('Left')
    if(x === 8) addHardBorder('Right')
    if(y === 0) addHardBorder('Top')
    if(y === 8) addHardBorder('Bottom')

    return (
        <div style={style}>
            {cell.value === null
                ? <Candidates candidates={cell.candidates} width={style.width-2} height={style.height-2} bgs={candBgs} />
                : <span style={{ fontSize: Math.floor(style.height/2) }}>{cell.value}</span>
            }
        </div>
    )
}

type SetPoints = (points: Point[]) => Point[]

export type BoardDisplayProps = {
    board: Board
    solveResult: SolveResult | null
    solutionBoard: Board
    selectedCells: Point[],
    setSelectedCells: (points: Point[] | SetPoints) => void
    selectedDigit: number | null
    celebration: boolean
}

export const BoardDisplay = (props: BoardDisplayProps) => {
    const {board, solutionBoard, selectedCells, setSelectedCells, selectedDigit, celebration} = props
    const [isSelecting, setIsSelecting] = React.useState(false)

    const highlightedNumber = selectedCells.length === 1 ? board[selectedCells[0].y][selectedCells[0].x].value : null
    const affectedPoints = React.useMemo(() => selectedCells.length === 1 ? getAffectedPoints(selectedCells[0]) : [], [selectedCells])

    const startSelect = (point, e: React.MouseEvent) => {
        e.stopPropagation() // Prevents the mousedown clear select handler from being fired
        if(e.ctrlKey){
            setSelectedCells(points => uniqueBy([...points, point], pointsEqual))
        }else{
            setSelectedCells([point])
        }
        setIsSelecting(true)
    }
    const addSelect = (point) => {
        if(isSelecting){
            setSelectedCells(points => uniqueBy([...points, point], pointsEqual))
        }
    }
    const endSelect = React.useCallback(() => {
        setIsSelecting(false)
    }, [])

    useEventListener('mouseup', endSelect)

    return (
        <div>
            {board.map((row, y) => {
                const cells = row.map((cell, x) => {
                    const point: Point = {x, y, id: getPointId(x, y)}
                    const selected = selectedCells.some(p => pointsEqual(p, point))
                    const affected = affectedPoints.some(p => pointsEqual(p, point))
                    const solutionValue = getBoardCell(solutionBoard, point).value as number
                    return (
                        <div
                            key={x}
                            onMouseDown={(e) => startSelect({x, y, id: getPointId(x, y)}, e)}
                            onMouseOver={() => addSelect({x, y, id: getPointId(x, y)})}
                            onMouseUp={endSelect}
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
                                cell={cell}
                                selected={selected}
                                affected={affected}
                                point={point}
                                solveResult={props.solveResult}
                                highlightedNumber={highlightedNumber}
                                selectedDigit={selectedDigit}
                                solutionValue={solutionValue}
                                celebration={celebration}
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