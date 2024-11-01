import { type Dispatch, type SetStateAction, useState } from "react";

import { EntityPickerModal } from "metabase/common/components/EntityPicker";
import { Sidesheet } from "metabase/common/components/Sidesheet";
import LegacyModal from "metabase/components/Modal";
import TippyPopover from "metabase/components/Popover/TippyPopover";
import TippyTooltip from "metabase/core/components/Tooltip";
import { PaletteCard } from "metabase/palette/components/Palette";
import {
  Box,
  Button,
  type ButtonProps,
  Flex,
  Group,
  Icon,
  Modal as MantineModal,
  Popover as MantinePopover,
  Tooltip as MantineTooltip,
  type ModalProps,
  Paper,
  Stack,
  Text,
} from "metabase/ui";

import { BulkActionBarPortal } from "../../../components/BulkActionBar/BulkActionBar";

const _Launchers = ({
  nested,
  setToastCount,
  setLegacyModalCount,
  setMantineModalCount,
  setSidesheetCount,
  setEntityPickerCount,
  setCommandPaletteCount,
}: {
  nested?: boolean;
  setToastCount: Dispatch<SetStateAction<number>>;
  setLegacyModalCount: Dispatch<SetStateAction<number>>;
  setMantineModalCount: Dispatch<SetStateAction<number>>;
  setSidesheetCount: Dispatch<SetStateAction<number>>;
  setEntityPickerCount: Dispatch<SetStateAction<number>>;
  setCommandPaletteCount: Dispatch<SetStateAction<number>>;
}) => {
  const titleSuffix = nested ? " (nested)" : "";
  return (
    <Group>
      <MantineTooltip withinPortal label={"Tooltip content" + titleSuffix}>
        <Button w="20rem">Mantine tooltip target {titleSuffix}</Button>
      </MantineTooltip>
      <MantinePopover withinPortal>
        <MantinePopover.Target>
          <Button w="20rem">Mantine popover target {titleSuffix}</Button>
        </MantinePopover.Target>
        <MantinePopover.Dropdown>
          <Paper p="md">Popover content {titleSuffix}</Paper>
        </MantinePopover.Dropdown>
      </MantinePopover>
      <Button onClick={() => setToastCount(c => c + 1)}>Toast</Button>
      <Button onClick={() => setMantineModalCount(c => c + 1)}>
        Mantine modal
      </Button>
      <Button onClick={() => setSidesheetCount(c => c + 1)}>Sidesheet</Button>
      <Button onClick={() => setEntityPickerCount(c => c + 1)}>
        Entity Picker
      </Button>
      {!nested && (
        <Button onClick={() => setCommandPaletteCount(c => c + 1)}>
          Command Palette Modal
        </Button>
      )}
      <TippyTooltip tooltip={"Tooltip content" + titleSuffix}>
        <Button w="20rem">Legacy tooltip target {titleSuffix}</Button>
      </TippyTooltip>
      <TippyPopover
        content={<Paper p="md">Popover content {titleSuffix}</Paper>}
      >
        <Button w="20rem">Legacy popover target {titleSuffix} </Button>
      </TippyPopover>
      <Button onClick={() => setLegacyModalCount(c => c + 1)}>
        Legacy modal
      </Button>
    </Group>
  );
};

export const FloatingElementsDemo = ({
  enableNesting,
}: {
  enableNesting: boolean;
}) => {
  const [legacyModalCount, setLegacyModalCount] = useState(0);
  const [mantineModalCount, setMantineModalCount] = useState(0);
  const [toastCount, setToastCount] = useState(0);
  const [sidesheetCount, setSidesheetCount] = useState(0);
  const [entityPickerCount, setEntityPickerCount] = useState(0);
  const [commandPaletteCount, setCommandPaletteCount] = useState(0);
  const Launchers = ({ nested }: { nested?: boolean }) => (
    <_Launchers
      setToastCount={setToastCount}
      setLegacyModalCount={setLegacyModalCount}
      setMantineModalCount={setMantineModalCount}
      setSidesheetCount={setSidesheetCount}
      setEntityPickerCount={setEntityPickerCount}
      setCommandPaletteCount={setCommandPaletteCount}
      nested={nested}
    />
  );

  return (
    <Stack p="lg">
      <Launchers />
      {Array.from({ length: toastCount }).map((_, index) => (
        <BulkActionBarPortal
          key={`simple-bulk-action-bar-${index}`}
          opened
          message="Toast message"
          p="lg"
        >
          <CloseButton
            onClick={() => setToastCount(c => c - 1)}
            c="#fff"
            bg="transparent"
          />
          {enableNesting && <Launchers nested />}
        </BulkActionBarPortal>
      ))}
      {Array.from({ length: legacyModalCount }).map((_, index) => (
        <LegacyModal isOpen key={`legacy-modal-${index}`}>
          <Group style={{ position: "relative" }}>
            <Stack spacing="md" p="md">
              <Box p="1rem 0">Legacy modal content</Box>
              {enableNesting && <Launchers nested />}
            </Stack>
            <CloseButton onClick={() => setLegacyModalCount(c => c - 1)} />
          </Group>
        </LegacyModal>
      ))}
      {Array.from({ length: mantineModalCount }).map((_, index) => (
        <SimpleModal
          key={`mantine-modal-${index}`}
          title={`Mantine modal`}
          onClose={() => setMantineModalCount(c => c - 1)}
        >
          <Stack spacing="md">
            <Text>Mantine modal content</Text>
            {enableNesting && <Launchers nested />}
          </Stack>
        </SimpleModal>
      ))}
      {Array.from({ length: sidesheetCount }).map((_, index) => (
        <Sidesheet
          key={`sidesheet-${index}`}
          isOpen
          onClose={() => setSidesheetCount(c => c - 1)}
        >
          Sidesheet content
          {enableNesting && <Launchers nested />}
        </Sidesheet>
      ))}
      {Array.from({ length: entityPickerCount }).map((_, index) => (
        <EntityPickerModal
          key={`entity-picker-${index}`}
          title={`Entity Picker`}
          selectedItem={null}
          canSelectItem={false}
          tabs={[]}
          onClose={() => {
            setEntityPickerCount(c => c - 1);
          }}
          onItemSelect={(_: any) => {}}
          onConfirm={() => {
            setEntityPickerCount(c => c - 1);
          }}
        />
      ))}
      {Array.from({ length: commandPaletteCount }).map((_, index) => (
        <PaletteCard
          key={`command-palette-${index}`}
          onClick={() => {
            setCommandPaletteCount(c => c - 1);
          }}
        >
          <div onClick={e => e.stopPropagation()}>
            <Flex p="lg">
              <Stack>
                <Text>Command Palette modal content</Text>
                {enableNesting && <Launchers nested />}
              </Stack>
            </Flex>
          </div>
        </PaletteCard>
      ))}
    </Stack>
  );
};

const CloseButton = (props: ButtonProps) => {
  return (
    <Button
      pos="absolute"
      top={0}
      right={0}
      w="3rem"
      style={{ border: "none" }}
      {...props}
    >
      <Icon name="close" />
    </Button>
  );
};

const SimpleModal = ({
  title,
  children = "MantineModal body",
  ...props
}: Omit<ModalProps, "opened">) => (
  <MantineModal.Root {...props} opened size="70rem">
    <MantineModal.Overlay />
    <MantineModal.Content>
      <MantineModal.Header>
        {" "}
        <MantineModal.Title>{title}</MantineModal.Title>
        <MantineModal.CloseButton />
      </MantineModal.Header>
      <MantineModal.Body>{children}</MantineModal.Body>
    </MantineModal.Content>
  </MantineModal.Root>
);
