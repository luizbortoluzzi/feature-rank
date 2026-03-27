import { useState } from 'react'
import * as LucideIcons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  Popover,
  Box,
  TextInput,
  SimpleGrid,
  ActionIcon,
  Text,
  ScrollArea,
  UnstyledButton,
} from '@mantine/core'
import { IconSearch, IconX } from '@tabler/icons-react'

// Lucide icons are forwardRef objects, not plain functions — filter by capitalised name only
const ALL_ICON_NAMES: string[] = Object.keys(LucideIcons).filter((key) =>
  /^[A-Z]/.test(key)
)

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
    name.toLowerCase().includes(search.toLowerCase())
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

  return (
    <Box>
      <Text component="label" fz="sm" fw={500} mb={4} display="block">
        Icon
      </Text>

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
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '7px 12px',
              border: `1px solid ${error ? 'var(--mantine-color-red-6)' : 'var(--mantine-color-gray-4)'}`,
              borderRadius: 'var(--mantine-radius-sm)',
              width: '100%',
              backgroundColor: 'var(--mantine-color-body)',
              cursor: 'pointer',
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

        <Popover.Dropdown p="sm">
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

      {error && (
        <Text c="red" fz="xs" mt={4}>
          {error}
        </Text>
      )}
    </Box>
  )
}
