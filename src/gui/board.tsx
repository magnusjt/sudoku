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
import { allCandidates, getAffectedPoints, getBoardCell, getPointId, pointsEqual } from '../core/utils/sudokuUtils'
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
import { actions } from '../index'
import { useSelector } from 'react-redux'
import { State } from '../state'
import { selectSolution } from '../selectors'

const Candidates = (props) => {
    const height = props.height
    const fontSize = height / 4

    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gridTemplateRows: '1fr 1fr 1fr',
                gap: 0,
                width: '100%',
                height: '100%',
                fontSize: fontSize,
                fontFamily: 'monospace',
                color: 'inherit'
            }}
        >
            {allCandidates.map(number => {
                return (
                    <div
                        style={{
                            background: props.bgs[number] ?? '',
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}
                        key={number}
                    >
                        {props.candidates.includes(number) && number}
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
    cellHeight: number
    point: Point
    highlightedNumber: number | null
    selectedDigit: number | null
    hasError: boolean
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
    hasError: boolean
) => {
    const hasElimination = cellHasElimination(effects, point)
    const hasSetValue = cellHasSetValue(effects, point)
    const hasActor = cellHasActor(actors, point)

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
    const {point, selected, affected, cell, highlightedNumber, selectedDigit, celebration, hasError} = props
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
        getCellBackgroundColor(actors, effects, point, cell, affected, selected, highlightedNumber, selectedDigit, hasError)
    , [actors, effects, point, cell, affected, selected, highlightedNumber, selectedDigit, hasError])

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
        height: '100%',
        width: '100%',
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
                ? <Candidates candidates={cell.candidates} bgs={candBgs} height={props.cellHeight} />
                : <span style={{ fontSize: Math.floor(props.cellHeight/2) }}>{cell.value}</span>
            }
        </div>
    )
}

export type BoardDisplayProps = {
    board: Board
    solveResult: SolveResult | null
    celebration: boolean
}

export const BoardDisplay = (props: BoardDisplayProps) => {
    const { board, celebration } = props
    const [isSelecting, setIsSelecting] = React.useState(false)

    const ref = React.useRef<HTMLDivElement | null>(null)
    const [height, setHeight] = React.useState(400)
    const cellHeight = height / 9

    // Preserve aspect ratio of the board.
    // We add an absolutely positioned div with width and height 100% to measure from.
    // We calculate those percents in pixels, and set both width and height to be the smallest of the two.
    React.useEffect(() => {
        const setBoardHeightDom = () => {
            if (ref?.current?.clientWidth && ref.current?.clientHeight) {
                const currentWidth = ref.current?.clientWidth
                const currentHeight = ref.current?.clientHeight
                const min = Math.min(currentWidth, currentHeight)
                setHeight(min)
            }
        }
        const setHeightAndRequest = () => {
            setBoardHeightDom()
            window.requestAnimationFrame(setHeightAndRequest)
        }

        setHeightAndRequest()
    }, [ref, setHeight])

    const solutionBoard = useSelector(selectSolution)
    const selectedCells = useSelector((state: State) => state.selectedCells)
    const selectedDigit = useSelector((state: State) => state.selectedDigit)

    const highlightedNumber = selectedCells.length === 1 ? board[selectedCells[0].y][selectedCells[0].x].value : null
    const affectedPoints = React.useMemo(() => selectedCells.length === 1 ? getAffectedPoints(selectedCells[0]) : [], [selectedCells])

    const startSelect = (point: Point, e: React.MouseEvent) => {
        if(e.ctrlKey){
            actions.addSelectedCell(point)
        }else{
            actions.setSelectedCells([point])
        }
        setIsSelecting(true)
    }
    const startSelectTouch = (point: Point) => {
        actions.setSelectedCells([point])
        setIsSelecting(true)
    }
    const addSelect = (point: Point) => {
        if(isSelecting){
            actions.addSelectedCell(point)
        }
    }
    const endSelect = React.useCallback(() => {
        setIsSelecting(false)
    }, [])

    useEventListener('mouseup', endSelect)

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                position: 'relative',
                display: 'flex',
                justifyContent: 'center'
            }}
        >
            {/* Add a dummy div that is used to measure the current widths and heights */}
            <div
                ref={ref}
                style={{
                    width: '100%',
                    height: '100%',
                    position: 'absolute',
                    zIndex: -1
                }}
            />
            <div
                style={{
                    width: height,
                    height: height,
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr',
                    gridTemplateRows: '1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr',
                    gap: 0,
                }}
            >
                {board.flatMap((row, y) => {
                    return row.map((cell, x) => {
                        const id = getPointId(x, y)
                        const point: Point = {x, y, id}
                        const selected = selectedCells.some(p => pointsEqual(p, point))
                        const affected = affectedPoints.some(p => pointsEqual(p, point))
                        const hasError = !!solutionBoard && cell.value !== null && cell.value !== getBoardCell(solutionBoard, point).value

                        return (
                            <div
                                key={id}
                                data-x={x}
                                data-y={y}
                                className={'touchevents-suck'}
                                onMouseDown={(e) => startSelect({x, y, id: getPointId(x, y)}, e)}
                                onMouseOver={() => addSelect({x, y, id: getPointId(x, y)})}
                                onMouseUp={endSelect}
                                onTouchStart={() => startSelectTouch({x, y, id: getPointId(x, y)})}
                                onTouchMove={(e) => {
                                    const loc = e.touches[0]

                                    const target = document.elementFromPoint(loc.clientX, loc.clientY)
                                    const actualTarget = target?.closest('.touchevents-suck')

                                    const xStr = actualTarget?.getAttribute('data-x')
                                    const yStr = actualTarget?.getAttribute('data-y')

                                    if (!(xStr && yStr)) {
                                        return
                                    }
                                    const x = Number(xStr)
                                    const y = Number(yStr)

                                    addSelect({x, y, id: getPointId(x, y)})
                                }}
                                onTouchCancel={endSelect}
                                onTouchEnd={endSelect}
                                style={{
                                    'WebkitTouchCallout': 'none',
                                    'WebkitUserSelect': 'none',
                                    'KhtmlUserSelect': 'none',
                                    'MozUserSelect': 'none',
                                    'msUserSelect': 'none',
                                    'userSelect': 'none',
                                    height: '100%',
                                }}
                            >
                                <CellDisplay
                                    cell={cell}
                                    cellHeight={cellHeight}
                                    selected={selected}
                                    affected={affected}
                                    point={point}
                                    solveResult={props.solveResult}
                                    highlightedNumber={highlightedNumber}
                                    selectedDigit={selectedDigit}
                                    hasError={hasError}
                                    celebration={celebration}
                                />
                            </div>
                        )
                    })
                })}
            </div>
        </div>
    )
}