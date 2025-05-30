"use client";
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { HelpCircle } from "lucide-react";
import invoiceSchema from "@/schemas/invoice.schema";
import { createInvoice } from "@/apis/invoice";
import InvoiceCredenza from "./credenza-invoice";

export default function MyForm() {
  const [openCredenza, setOpenCredenza] = React.useState(false);
  const [existInvoice, setExistInvoice] = React.useState(false);
  const [invoiceId, setInvoiceId] = React.useState<string | undefined>(
    undefined
  );
  const [loading, setLoading] = React.useState(false);

  const form = useForm<z.infer<typeof invoiceSchema>>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoiceCode: "",
      taxCode: "",
      partnerCode: "VNP",
      fullName: "",
      address: "",
      phone: "",
      email: "",
    },
  });

  // 🔁 Reset các trường khác khi taxCode thay đổi
  React.useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (name === "taxCode" && type === "change") {
        form.setValue("fullName", "");
        form.setValue("address", "");
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  const onSubmit = async (values: z.infer<typeof invoiceSchema>) => {
    try {
      setLoading(true);
      const response = await createInvoice(values);
      if (response.status === 201) {
        toast.success("Hóa đơn đã được tạo thành công!");
        form.reset();
        setInvoiceId(response.data.id);
        setOpenCredenza(true);
        setExistInvoice(true);
      } else {
        toast.error("Đã có lỗi xảy ra, vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Lỗi khi gửi form", error);
      toast.error("Gửi form thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <HelpCircle className="h-4 w-4" />
              Hướng dẫn sử dụng
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Hướng dẫn sử dụng</DialogTitle>
              <DialogDescription className="space-y-4 pt-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Bước 1: Kiểm tra mã số thuế</h4>
                  <p className="text-sm text-muted-foreground">
                    - Nhập mã số thuế vào ô "Mã số thuế"
                    - Nhấn nút "Kiểm tra" để xác thực thông tin
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Bước 2: Điền thông tin</h4>
                  <p className="text-sm text-muted-foreground">
                    - Điền đầy đủ các thông tin còn lại trong form
                    - Các trường có dấu * là bắt buộc phải điền
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Bước 3: Kiểm tra email</h4>
                  <p className="text-sm text-muted-foreground">
                    - Sau khi gửi form thành công, hóa đơn sẽ được gửi qua email
                    - Vui lòng kiểm tra cả hộp thư chính và thư mục spam
                  </p>
                </div>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {/* Mã hóa đơn */}
            <FormField
              control={form.control}
              name="invoiceCode"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="Nhập mã hóa đơn *"
                      className="text-sm"
                      disabled={loading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Đối tác */}
            <FormField
              control={form.control}
              name="partnerCode"
              render={({ field }) => (
                <FormItem>
                  <Select
                    disabled={loading}
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn đối tác" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="VNP">VNP</SelectItem>
                      <SelectItem value="MISA">MISA</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Mã số thuế + nút kiểm tra */}
          <FormField
            control={form.control}
            name="taxCode"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nhập mã số thuế *"
                      className="text-sm"
                      disabled={loading}
                      {...field}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={loading}
                      onClick={async () => {
                        if (!field.value) {
                          toast.warning("Vui lòng nhập mã số thuế trước.");
                          return;
                        }

                        try {
                          setLoading(true);
                          const result = await checkTaxCode(field.value, form.getValues("partnerCode"));
                          if (!result) return; // Early return if there was an error

                          form.setValue("taxCode", result.data?.taxCode || "");
                          form.setValue("fullName", result.data?.fullName || "");
                          form.setValue("address", result.data?.addressLine || "");

                          toast.success("Đã lấy thông tin từ mã số thuế.");
                        } catch (error) {
                          console.error(error);
                          toast.error("Lỗi khi kiểm tra mã số thuế.");
                        } finally {
                          setLoading(false);
                        }
                      }}
                    >
                      Kiểm tra
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Tên đầy đủ */}
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    placeholder="Nhập tên đầy đủ"
                    disabled={loading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Địa chỉ */}
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    placeholder="Nhập địa chỉ"
                    disabled={loading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Số điện thoại */}
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    placeholder="Nhập số điện thoại *"
                    disabled={loading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    placeholder="Nhập email"
                    disabled={loading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Nút Gửi */}
          <Button type="submit" className="w-full" disabled={loading}>
            Gửi
          </Button>
        </form>

        {/* Loading state after successful submission */}
        {loading && (
          <div className="w-full flex justify-center mt-4">
            <span className="text-sm text-muted-foreground animate-pulse">
              Đang xử lý hóa đơn, vui lòng đợi trong giây lát...
            </span>
          </div>
        )}

        {/* Hiển thị invoice sau khi tạo thành công */}
        {existInvoice && <InvoiceCredenza invoiceId={invoiceId} />}
      </Form>
    </div>
  );
}

// ✅ Gọi API check mã số thuế
const checkTaxCode = async (taxCode: string, partnerCode: string) => {
  const url = `${process.env.NEXT_PUBLIC_INVOICE_ENDPOINT}/tax-code/${taxCode}?partnerCode=${partnerCode}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) {
      toast.error(data.message);
      return;
    }
    return data;
  } catch (error) {
    console.error(error);
    toast.error("Lỗi khi kiểm tra mã số thuế");
  }
};
