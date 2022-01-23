import { render, Container, VerticalSpace, Text } from '@create-figma-plugin/ui'
import { on, emit } from '@create-figma-plugin/utilities'
import { h } from 'preact'
import { useCallback, useState, useEffect } from 'preact/hooks'
import chroma from 'chroma-js'
import styles from './styles.css'

const Plugin = () => {
	const [values, setValues] = useState({
		x: 0,
		y: 0,
		blur: 0,
		spread: 0,
		r: 0,
		g: 0,
		b: 0,
		opacity: 0
	})

	const handleValueUpdate = useCallback((data) => {
		setValues(data)
	}, [])

	useEffect(() => {
		on('VALUE_UPDATE', handleValueUpdate)
	}, [])

	const color = chroma.gl(values.r, values.g, values.b).hex()

	return (
		<Container>
			<VerticalSpace space="small" />
			<div class={styles.grid}>
				<div class={styles.muted}>X</div>
				<div class={styles.value} key={values.x}>
					{Math.round(values.x)}
				</div>
				<div class={styles.muted}>Blur</div>
				<div class={styles.value} key={values.blur}>
					{Math.round(values.blur)}
				</div>
				<div class={styles.muted}>Y</div>
				<div class={styles.value} key={values.y}>
					{Math.round(values.y)}
				</div>
				<div class={styles.muted}>Spread</div>
				<div class={styles.value}>{values.spread}</div>
				<div class={styles.color}>
					<span class={styles.badge} style={{ background: color }} />
					<span
						class={styles.value}
						key={values.r + values.g + values.b}>
						{color.substring(1) || '000000'}
					</span>
				</div>
				<div class={styles.value} key={values.opacity}>
					{(values.opacity * 100).toFixed(2)}%
				</div>
			</div>

			<VerticalSpace space="small" />
		</Container>
	)
}

export default render(Plugin)
