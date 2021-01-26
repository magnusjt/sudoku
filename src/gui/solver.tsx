import React from 'react'
import { Board, Point, SolveResult } from '../core/types'
import * as solve from '../core/solve'
import Paper from '@material-ui/core/Paper'
import { Button } from '@material-ui/core'
import { actorColor, eliminationColor, setValueColor } from './board'

export type SolverProps = {
    board: Board
    solveResult: SolveResult | null
    onSolveResult: (solveResult: SolveResult | null, prevBoard: Board) => void
}

const pointToStr = (point: Point) => `r${point.y+1}c${point.x+1}`

export const Solver = (props: SolverProps) => {
    const {board, solveResult, onSolveResult} = props
    const [skippedTechniques, setSkippedTechniques] = React.useState<string[]>([])

    const onToggleTechnique = React.useCallback((type: string) => {
        setSkippedTechniques(s => {
            if(s.some(t => t === type)){
                return s.filter(t => t !== type)
            }else{
                return [...s, type]
            }
        })
    }, [])

    const iterate = React.useCallback(() => {
        let boardBeforeSolve = board
        let res = solve.iterate(boardBeforeSolve)
        while(res !== null && skippedTechniques.includes(res.technique)){
            boardBeforeSolve = res.board
            res = solve.iterate(boardBeforeSolve)
        }
        onSolveResult(res, boardBeforeSolve)
    }, [board, skippedTechniques, onSolveResult])

    return (
        <div>
            <h3>Solver</h3>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Button color='primary' variant='outlined' fullWidth onClick={iterate}>Iterate</Button>
            </div>
            {solveResult && solveResult.technique !== 'done' &&
            <div>
                <i>Technique:</i>
                <br />
                {solveResult.technique}
                <br />
                <i>Actors:</i>
                <br />
                <span style={{ background: actorColor }}>&nbsp;&nbsp;</span>
                {solveResult.actors.map(actor => {
                    return (
                        <span> {pointToStr(actor.point)} </span>
                    )
                })}
                <br />
                <i>Effects:</i>
                {solveResult.effects.map(effect => {
                    return (
                        <div>
                            {effect.type === 'elimination' &&
                            <div>
                                <span style={{ background: eliminationColor }}>&nbsp;&nbsp;</span>
                                Eliminate {effect.numbers.join(',')} from {pointToStr(effect.point)}
                            </div>
                            }
                            {effect.type === 'value' &&
                            <div>
                                <span style={{ background: setValueColor }}>&nbsp;&nbsp;</span>
                                Set {effect.number} at {pointToStr(effect.point)}
                            </div>
                            }
                        </div>
                    )
                })}
            </div>
            }
            <div>
                <h4>Skip techniques</h4>
                <div style={{display: 'flex', flexDirection: 'column'}}>
                {solve.techniques.map(tech => {
                    const skipped = skippedTechniques.some(t => t === tech.type)
                    return (
                        <Button
                            size='small'
                            color='default'
                            fullWidth={true}
                            variant='outlined'
                            style={{color: skipped ? 'red' : ''}}
                            onClick={() => onToggleTechnique(tech.type)}
                        >
                            {tech.type}
                        </Button>
                    )
                })}
                </div>
            </div>
        </div>
    )
}