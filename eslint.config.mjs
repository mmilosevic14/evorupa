import { FlatCompat } from '@eslint/eslintrc'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const compat = new FlatCompat({
	baseDirectory: __dirname,
})

const config = [
	{
		ignores: [
			'.next/**',
			'.next-build/**',
			'.next-prod/**',
			'.vercel/**',
			'out/**',
			'build/**',
			'coverage/**',
			'public/sw.js',
			'public/sw.js.map',
			'public/workbox-*.js',
			'public/workbox-*.js.map',
		],
	},
	...compat.extends('next/core-web-vitals'),
]

export default config