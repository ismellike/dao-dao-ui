import { ReactNode } from 'react'

import { BreadcrumbsProps } from './Breadcrumbs'

export type PageHeaderProps = {
  title?: string
  breadcrumbs?: BreadcrumbsProps
  className?: string
  noBorder?: boolean
  // Center title, breadcrumbs, or centerNode (whichever is displayed) even when
  // not responsive.
  forceCenter?: boolean
  centerNode?: ReactNode
  rightNode?: ReactNode
  gradient?: boolean
  // Expands the border to the edge of the page.
  expandBorderToEdge?: boolean
}
