import {
	Button,
	Columns,
	Container,
	render,
	Text,
	TextboxNumeric,
	VerticalSpace
} from '@create-figma-plugin/ui'
import { on, emit } from '@create-figma-plugin/utilities'
import { h } from 'preact'
import { useCallback, useState, useEffect } from 'preact/hooks'

import { CloseHandler, CreateRectanglesHandler } from './types'

import styles from './styles.css'
import chroma from 'chroma-js'

const Plugin = () => {
	const [values, setValues] = useState({ x: 10, y: 10, blur: 100, spread: 0 })

	const handleValueUpdate = useCallback((data) => {
		setValues(data)
	}, [])

	useEffect(() => {
		on('VALUE_UPDATE', handleValueUpdate)
	}, [])

	const color = chroma.gl(values.r, values.g, values.b).hex()

	console.log(color)

	return (
		<Container>
			<VerticalSpace space='large' />
			<div class={styles.grid}>
				<FauxInput value={values.x}>X</FauxInput>
				<FauxInput value={values.blur}>Blur</FauxInput>
				<FauxInput value={values.y}>Y</FauxInput>
				<FauxInput value={values.spread}>Spread</FauxInput>
				<div class={styles.color}>
					<span class={styles.badge} style={{ background: color }} />
					{color || '#000000'}
				</div>
				<div>{values.opacity * 100}%</div>
			</div>
			<VerticalSpace space='small' />
		</Container>
	)
}

const FauxInput = ({ value, children }) => {
	return (
		<div class={styles.input}>
			<Text muted>{children}</Text>
			{value.toFixed(2)}
		</div>
	)
}

export default render(Plugin)
