import { useState } from 'react'
import * as LucideIcons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  Popover,
  Box,
  Input,
  TextInput,
  SimpleGrid,
  ActionIcon,
  Text,
  ScrollArea,
  UnstyledButton,
  rem,
} from '@mantine/core'
import { IconSearch, IconX } from '@tabler/icons-react'

// Lucide icons are forwardRef objects, not plain functions — filter by capitalised name only
const ALL_ICON_NAMES: string[] = Object.keys(LucideIcons).filter((key) => /^[A-Z]/.test(key))

function getLucideIcon(name: string): LucideIcon | null {
  const Icon = (LucideIcons as Record<string, unknown>)[name]
  return Icon != null ? (Icon as LucideIcon) : null
}

interface IconPickerProps {
  value: string
  onChange: (icon: string) => void
  error?: string
}

export function IconPicker({ value, onChange, error }: IconPickerProps) {
  const [opened, setOpened] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = ALL_ICON_NAMES.filter((name) =>
    name.toLowerCase().includes(search.toLowerCase()),
  ).slice(0, 80)

  const SelectedIcon = value ? getLucideIcon(value) : null

  function handleClose() {
    setOpened(false)
    setSearch('')
  }

  function handleSelect(name: string) {
    onChange(name)
    handleClose()
  }

  const borderColor = error
    ? 'var(--mantine-color-red-6)'
    : opened
      ? 'var(--mantine-color-indigo-5)'
      : 'var(--mantine-color-gray-2)'

  const boxShadow = opened
    ? '0 0 0 3px color-mix(in srgb, var(--mantine-color-indigo-5) 14%, transparent)'
    : undefined

  return (
    <Input.Wrapper label="Icon" error={error}>
      <Popover
        opened={opened}
        onClose={handleClose}
        width={320}
        position="bottom-start"
        withinPortal
      >
        <Popover.Target>
          <UnstyledButton
            onClick={() => setOpened((o) => !o)}
            mt={6}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              height: rem(52),
              padding: '0 12px',
              border: `1px solid ${borderColor}`,
              borderRadius: 'var(--mantine-radius-xl)',
              width: '100%',
              backgroundColor: 'var(--mantine-color-white)',
              cursor: 'pointer',
              transition: 'border-color 120ms ease, box-shadow 120ms ease',
              boxShadow,
            }}
          >
            {SelectedIcon ? (
              <SelectedIcon size={16} style={{ flexShrink: 0 }} />
            ) : (
              <Box
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  backgroundColor: 'var(--mantine-color-gray-3)',
                  flexShrink: 0,
                }}
              />
            )}
            <Text fz="sm" c={value ? undefined : 'dimmed'} style={{ flex: 1, textAlign: 'left' }}>
              {value || 'Select an icon…'}
            </Text>
            {value && (
              <ActionIcon
                size="xs"
                variant="subtle"
                color="gray"
                component="span"
                onClick={(e) => {
                  e.stopPropagation()
                  onChange('')
                }}
                aria-label="Clear icon"
              >
                <IconX size={12} />
              </ActionIcon>
            )}
          </UnstyledButton>
        </Popover.Target>

        <Popover.Dropdown p="sm" style={{ boxShadow: '0 0 0 1px rgba(30, 36, 53, 0.06), 0 8px 16px rgba(30, 36, 53, 0.10), 0 24px 60px rgba(30, 36, 53, 0.18)' }}>
          <TextInput
            placeholder="Search icons…"
            leftSection={<IconSearch size={14} />}
            size="xs"
            mb="xs"
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            autoFocus
          />
          <ScrollArea h={240}>
            <SimpleGrid cols={7} spacing={4}>
              {filtered.map((name) => {
                const Icon = getLucideIcon(name)
                if (!Icon) return null
                return (
                  <ActionIcon
                    key={name}
                    variant={value === name ? 'filled' : 'subtle'}
                    color={value === name ? 'indigo' : 'gray'}
                    size="md"
                    title={name}
                    onClick={() => handleSelect(name)}
                    aria-label={name}
                  >
                    <Icon size={16} />
                  </ActionIcon>
                )
              })}
            </SimpleGrid>
            {filtered.length === 0 && (
              <Text fz="sm" c="dimmed" ta="center" py="md">
                No icons found
              </Text>
            )}
          </ScrollArea>
          {filtered.length === 80 && (
            <Text fz="xs" c="dimmed" ta="center" pt="xs">
              Showing first 80 — refine your search to narrow down
            </Text>
          )}
        </Popover.Dropdown>
      </Popover>
    </Input.Wrapper>
  )
}
