import React, { useCallback, useState } from "react";
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import AppScreen from "../components/AppScreen";
import { useAppTheme } from "../context/ThemeContext";
import { Account } from "../types";
import { RootStackParamList } from "../navigation/AppNavigator";
import {
  addAccount,
  archiveAccount,
  getActiveAccounts,
  updateAccount,
} from "../services/accountService";

const paymentMethods = [
  "Credit Card",
  "Debit Card",
  "Cash",
  "UPI",
  "Online Payment",
  "Venmo",
  "Zelle",
  "PayPal",
  "Bank Transfer",
  "Check",
  "Other",
];

type Props = NativeStackScreenProps<RootStackParamList, "Accounts">;

export default function AccountsScreen({ navigation }: Props) {
  const { colors, isDark } = useAppTheme();
  const styles = createStyles(colors, isDark);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [name, setName] = useState("");
  const [provider, setProvider] = useState("");
  const [lastFour, setLastFour] = useState("");
  const [icon, setIcon] = useState("💳");
  const [paymentMethod, setPaymentMethod] = useState("Credit Card");
  const [isDefault, setIsDefault] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentModalTarget, setPaymentModalTarget] =
    useState<"ADD" | "EDIT">("ADD");

  const [editName, setEditName] = useState("");
  const [editProvider, setEditProvider] = useState("");
  const [editLastFour, setEditLastFour] = useState("");
  const [editIcon, setEditIcon] = useState("💳");
  const [editPaymentMethod, setEditPaymentMethod] = useState("Credit Card");
  const [editIsDefault, setEditIsDefault] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadAccounts();
    }, [])
  );

  async function loadAccounts() {
    setAccounts(await getActiveAccounts());
  }

  function resetForm() {
    setName("");
    setProvider("");
    setLastFour("");
    setIcon("💳");
    setPaymentMethod("Credit Card");
    setIsDefault(true);
  }

  function startEdit(account: Account) {
    setEditingAccount(account);
    setEditName(account.name);
    setEditProvider(account.provider);
    setEditLastFour(account.lastFour);
    setEditIcon(account.icon);
    setEditPaymentMethod(account.paymentMethod);
    setEditIsDefault(account.isDefault === 1);
  }

  function cancelEdit() {
    setEditingAccount(null);
    setEditName("");
    setEditProvider("");
    setEditLastFour("");
    setEditIcon("💳");
    setEditPaymentMethod("Credit Card");
    setEditIsDefault(false);
  }

  async function handleAdd() {
    if (!name.trim()) {
      Alert.alert("Missing name", "Give this account a recognizable name.");
      return;
    }

    if (lastFour && !/^\d{4}$/.test(lastFour)) {
      Alert.alert("Invalid last four", "Enter exactly four digits or leave it blank.");
      return;
    }

    const input = {
      name,
      provider,
      lastFour,
      icon,
      paymentMethod,
      isDefault,
    };

    await addAccount(input);

    resetForm();
    await loadAccounts();
  }

  async function handleSaveEdit(account: Account) {
    if (!editName.trim()) {
      Alert.alert("Missing name", "Give this account a recognizable name.");
      return;
    }

    if (editLastFour && !/^\d{4}$/.test(editLastFour)) {
      Alert.alert("Invalid last four", "Enter exactly four digits or leave it blank.");
      return;
    }

    await updateAccount(account.id, {
      name: editName,
      provider: editProvider,
      lastFour: editLastFour,
      icon: editIcon,
      paymentMethod: editPaymentMethod,
      isDefault: editIsDefault,
    });

    cancelEdit();
    await loadAccounts();
  }

  function confirmArchive(account: Account) {
    Alert.alert(
      "Archive Account",
      "Old transactions will keep this account, but it will no longer appear when adding new records.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Archive",
          style: "destructive",
          onPress: async () => {
            await archiveAccount(account.id);
            if (editingAccount?.id === account.id) cancelEdit();
            await loadAccounts();
          },
        },
      ]
    );
  }

  return (
    <AppScreen>
      <Text style={styles.title}>Accounts</Text>
      <Text style={styles.subtitle}>
        Add your cards, bank accounts, cash wallets, and payment apps
      </Text>

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Add Account</Text>

        <Text style={styles.label}>Payment Method</Text>
        <TouchableOpacity
          style={styles.selector}
          onPress={() => {
            setPaymentModalTarget("ADD");
            setShowPaymentModal(true);
          }}
        >
          <Text style={styles.selectorText}>{paymentMethod}</Text>
          <Text style={styles.arrow}>▼</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Account Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Chase Sapphire"
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={styles.label}>Bank or Provider</Text>
        <TextInput
          style={styles.input}
          value={provider}
          onChangeText={setProvider}
          placeholder="Chase, Bank of America, PayPal"
          placeholderTextColor={colors.textSecondary}
        />

        <View style={styles.inputRow}>
          <View style={styles.iconField}>
            <Text style={styles.label}>Icon</Text>
            <TextInput
              style={[styles.input, styles.centerInput]}
              value={icon}
              onChangeText={setIcon}
              maxLength={2}
            />
          </View>

          <View style={styles.lastFourField}>
            <Text style={styles.label}>Last Four (optional)</Text>
            <TextInput
              style={styles.input}
              value={lastFour}
              onChangeText={(value) => setLastFour(value.replace(/\D/g, ""))}
              keyboardType="number-pad"
              maxLength={4}
              placeholder="4821"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.defaultRow, isDefault && styles.defaultRowSelected]}
          onPress={() => setIsDefault(!isDefault)}
        >
          <Text style={styles.defaultMark}>{isDefault ? "✓" : ""}</Text>
          <View style={styles.defaultTextBox}>
            <Text style={styles.defaultTitle}>Default for {paymentMethod}</Text>
            <Text style={styles.defaultSubtitle}>
              Select this account automatically for new records
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveButton} onPress={handleAdd}>
          <Text style={styles.saveButtonText}>Add Account</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.activityButton}
        onPress={() => navigation.navigate("AccountTransactions")}
      >
        <View>
          <Text style={styles.activityButtonTitle}>Account Activity</Text>
          <Text style={styles.activityButtonSubtitle}>
            View all account totals and transactions
          </Text>
        </View>
        <Text style={styles.activityButtonArrow}>›</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Your Accounts</Text>

      {accounts.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No accounts added yet</Text>
          <Text style={styles.emptyText}>
            Credit Card remains the default payment method until you add a
            specific account.
          </Text>
        </View>
      ) : (
        accounts.map((account) => {
          const isEditing = editingAccount?.id === account.id;

          return (
            <View
              key={account.id}
              style={[styles.accountCard, isEditing && styles.editingCard]}
            >
              {isEditing ? (
                <View style={styles.inlineEditor}>
                  <Text style={styles.inlineTitle}>Edit Account</Text>

                  <Text style={styles.label}>Payment Method</Text>
                  <TouchableOpacity
                    style={styles.selector}
                    onPress={() => {
                      setPaymentModalTarget("EDIT");
                      setShowPaymentModal(true);
                    }}
                  >
                    <Text style={styles.selectorText}>{editPaymentMethod}</Text>
                    <Text style={styles.arrow}>▼</Text>
                  </TouchableOpacity>

                  <Text style={styles.label}>Account Name</Text>
                  <TextInput
                    style={styles.input}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Chase Sapphire"
                    placeholderTextColor={colors.textSecondary}
                    autoFocus
                  />

                  <Text style={styles.label}>Bank or Provider</Text>
                  <TextInput
                    style={styles.input}
                    value={editProvider}
                    onChangeText={setEditProvider}
                    placeholder="Chase, Bank of America, PayPal"
                    placeholderTextColor={colors.textSecondary}
                  />

                  <View style={styles.inputRow}>
                    <View style={styles.iconField}>
                      <Text style={styles.label}>Icon</Text>
                      <TextInput
                        style={[styles.input, styles.centerInput]}
                        value={editIcon}
                        onChangeText={setEditIcon}
                        maxLength={2}
                      />
                    </View>

                    <View style={styles.lastFourField}>
                      <Text style={styles.label}>Last Four</Text>
                      <TextInput
                        style={styles.input}
                        value={editLastFour}
                        onChangeText={(value) =>
                          setEditLastFour(value.replace(/\D/g, ""))
                        }
                        keyboardType="number-pad"
                        maxLength={4}
                        placeholder="4821"
                        placeholderTextColor={colors.textSecondary}
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.defaultRow,
                      editIsDefault && styles.defaultRowSelected,
                    ]}
                    onPress={() => setEditIsDefault(!editIsDefault)}
                  >
                    <Text style={styles.defaultMark}>
                      {editIsDefault ? "✓" : ""}
                    </Text>
                    <View style={styles.defaultTextBox}>
                      <Text style={styles.defaultTitle}>
                        Default for {editPaymentMethod}
                      </Text>
                      <Text style={styles.defaultSubtitle}>
                        Select automatically for new records
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.inlineActions}>
                    <TouchableOpacity
                      style={[styles.cancelButton, styles.inlineButton]}
                      onPress={cancelEdit}
                    >
                      <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.saveButton, styles.inlineButton]}
                      onPress={() => handleSaveEdit(account)}
                    >
                      <Text style={styles.saveButtonText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <>
                  <Text style={styles.accountIcon}>{account.icon}</Text>
                  <View style={styles.accountInfo}>
                    <Text style={styles.accountName}>
                      {account.name}
                      {account.lastFour ? ` •••• ${account.lastFour}` : ""}
                    </Text>
                    <Text style={styles.accountMeta}>
                      {account.paymentMethod}
                      {account.provider ? ` • ${account.provider}` : ""}
                      {account.isDefault === 1 ? " • Default" : ""}
                    </Text>

                    <View style={styles.accountActions}>
                      <TouchableOpacity
                        onPress={() =>
                          navigation.navigate("AccountTransactions", {
                            accountId: account.id,
                          })
                        }
                      >
                        <Text style={styles.transactionsText}>Transactions</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => startEdit(account)}>
                        <Text style={styles.editText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => confirmArchive(account)}>
                        <Text style={styles.archiveText}>Archive</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              )}
            </View>
          );
        })
      )}

      <Modal visible={showPaymentModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Payment Method</Text>
            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method}
                style={styles.modalItem}
                onPress={() => {
                  if (paymentModalTarget === "EDIT") {
                    setEditPaymentMethod(method);
                  } else {
                    setPaymentMethod(method);
                  }
                  setShowPaymentModal(false);
                }}
              >
                <Text style={styles.modalItemText}>{method}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowPaymentModal(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </AppScreen>
  );
}

function createStyles(colors: any, isDark: boolean) {
  const fieldBackground = isDark ? "#020617" : "#F8FAFC";

  return StyleSheet.create({
    title: { fontSize: 30, fontWeight: "900", color: colors.textPrimary },
    subtitle: {
      marginTop: 4,
      marginBottom: 20,
      color: colors.textSecondary,
      fontWeight: "700",
      lineHeight: 20,
    },
    formCard: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 24,
      padding: 18,
      marginBottom: 22,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "900",
      color: colors.textPrimary,
      marginBottom: 10,
    },
    label: {
      marginTop: 12,
      marginBottom: 7,
      color: colors.textPrimary,
      fontWeight: "800",
    },
    input: {
      backgroundColor: fieldBackground,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      padding: 14,
      fontSize: 16,
      color: colors.textPrimary,
    },
    selector: {
      backgroundColor: fieldBackground,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      padding: 15,
      flexDirection: "row",
      justifyContent: "space-between",
    },
    selectorText: { color: colors.textPrimary, fontWeight: "800", fontSize: 16 },
    arrow: { color: colors.accent, fontWeight: "900" },
    inputRow: { flexDirection: "row", gap: 10 },
    iconField: { width: 76 },
    lastFourField: { flex: 1 },
    centerInput: { textAlign: "center" },
    defaultRow: {
      marginTop: 16,
      padding: 13,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    defaultRowSelected: { borderColor: colors.accent },
    defaultMark: {
      width: 24,
      height: 24,
      borderRadius: 7,
      backgroundColor: colors.accent,
      color: "#FFFFFF",
      textAlign: "center",
      lineHeight: 24,
      fontWeight: "900",
    },
    defaultTextBox: { flex: 1 },
    defaultTitle: { color: colors.textPrimary, fontWeight: "900" },
    defaultSubtitle: {
      marginTop: 2,
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: "700",
    },
    saveButton: {
      marginTop: 18,
      padding: 15,
      borderRadius: 15,
      backgroundColor: colors.accent,
      alignItems: "center",
    },
    saveButtonText: { color: "#FFFFFF", fontWeight: "900", fontSize: 16 },
    cancelButton: {
      marginTop: 10,
      padding: 14,
      borderRadius: 14,
      backgroundColor: fieldBackground,
      alignItems: "center",
    },
    cancelText: { color: colors.textPrimary, fontWeight: "900" },
    accountCard: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 18,
      padding: 15,
      marginBottom: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    editingCard: { borderColor: colors.accent },
    inlineEditor: { flex: 1 },
    inlineTitle: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: "900",
      marginBottom: 4,
    },
    inlineActions: {
      flexDirection: "row",
      gap: 10,
      marginTop: 14,
    },
    inlineButton: { flex: 1, marginTop: 0 },
    accountIcon: { fontSize: 28 },
    accountInfo: { flex: 1 },
    accountName: { color: colors.textPrimary, fontWeight: "900", fontSize: 16 },
    accountMeta: {
      marginTop: 4,
      color: colors.textSecondary,
      fontWeight: "700",
      fontSize: 12,
    },
    accountActions: {
      flexDirection: "row",
      gap: 18,
      marginTop: 10,
    },
    transactionsText: { color: colors.accent, fontWeight: "900" },
    editText: { color: colors.textPrimary, fontWeight: "900" },
    archiveText: { color: colors.danger, fontWeight: "800" },
    activityButton: {
      padding: 16,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.accent,
      backgroundColor: colors.card,
      marginBottom: 20,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    activityButtonTitle: {
      color: colors.textPrimary,
      fontWeight: "900",
      fontSize: 16,
    },
    activityButtonSubtitle: {
      marginTop: 3,
      color: colors.textSecondary,
      fontWeight: "700",
      fontSize: 12,
    },
    activityButtonArrow: {
      color: colors.accent,
      fontWeight: "900",
      fontSize: 30,
    },
    emptyCard: {
      padding: 18,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    emptyTitle: { color: colors.textPrimary, fontWeight: "900", fontSize: 16 },
    emptyText: {
      marginTop: 5,
      color: colors.textSecondary,
      fontWeight: "700",
      lineHeight: 19,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(0,0,0,0.45)",
    },
    modalCard: {
      maxHeight: "80%",
      padding: 20,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      backgroundColor: colors.card,
    },
    modalTitle: {
      marginBottom: 12,
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: "900",
    },
    modalItem: {
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalItemText: { color: colors.textPrimary, fontSize: 16, fontWeight: "800" },
  });
}
